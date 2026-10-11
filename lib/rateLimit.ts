/**
 * Rate Limiter berbasis algoritma Token-Bucket in-memory per IP.
 * Ringan, tanpa dependensi eksternal, dan aman untuk single-instance server.
 */

export interface RateLimiterOptions {
  capacity: number;        // Kapasitas token maksimum (burst)
  refillPerSecond: number; // Jumlah token ditambahkan per detik
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number;      // Detik yang harus ditunggu sebelum request diizinkan
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

export class TokenBucketLimiter {
  private capacity: number;
  private refillPerSecond: number;
  private buckets = new Map<string, Bucket>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.capacity = options.capacity;
    this.refillPerSecond = options.refillPerSecond;

    // Bersihkan IP yang sudah idle secara periodik
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, bucket] of this.buckets.entries()) {
      // Jika token sudah penuh dan tidak ada aktivitas > 5 menit, hapus dari map
      if (now - bucket.lastRefill > 300_000 && bucket.tokens >= this.capacity) {
        this.buckets.delete(ip);
      }
    }
  }

  check(req: Request, cost = 1): RateLimitResult {
    const ip = getClientIp(req);
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(ip, bucket);
    } else {
      const elapsed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerSecond);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        success: true,
        remaining: Math.floor(bucket.tokens),
        retryAfter: 0,
      };
    }

    const deficit = cost - bucket.tokens;
    const retryAfter = Math.max(1, Math.ceil(deficit / this.refillPerSecond));
    return {
      success: false,
      remaining: 0,
      retryAfter,
    };
  }

  // Digunakan untuk testing dan reset state
  reset(): void {
    this.buckets.clear();
  }
}

export function rateLimitResponse(
  retryAfter: number,
  message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
): Response {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}

// 1. Scan: Maksimal 1 scan per 5 menit per IP (burst 1, refill 1/300)
export const scanLimiter = new TokenBucketLimiter({
  capacity: 1,
  refillPerSecond: 1 / 300,
});

// 2. Search & Search-Songs: Burst 20 request, refill 5 token/detik
export const searchLimiter = new TokenBucketLimiter({
  capacity: 20,
  refillPerSecond: 5,
});

// 3. Audio Stream: Burst 50 request, refill 10 token/detik
export const streamLimiter = new TokenBucketLimiter({
  capacity: 50,
  refillPerSecond: 10,
});
