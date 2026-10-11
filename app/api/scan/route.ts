import { NextRequest } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { scanLibrary, isScanLocked, ScanLockError } from '@/lib/scanner';
import { scanLimiter, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Cek lock pemindaian: jika sedang berjalan, tolak langsung dengan HTTP 409
  if (isScanLocked()) {
    return Response.json(
      { error: 'Proses pemindaian sedang berjalan. Harap tunggu hingga selesai.' },
      { status: 409 }
    );
  }

  // 2. Rate limit khusus scan: maksimal 1 scan per 5 menit per IP
  const rate = scanLimiter.check(req);
  if (!rate.success) {
    return rateLimitResponse(
      rate.retryAfter,
      `Terlalu banyak permintaan pemindaian. Coba lagi dalam ${rate.retryAfter} detik.`
    );
  }

  await ensureSchema();
  try {
    const result = await scanLibrary();
    return Response.json(result);
  } catch (e: any) {
    if (e instanceof ScanLockError || e?.name === 'ScanLockError') {
      return Response.json({ error: e.message }, { status: 409 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}