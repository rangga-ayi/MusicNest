import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { executeSearch } from '@/lib/search';
import { searchLimiter, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rate = searchLimiter.check(req);
  if (!rate.success) {
    return rateLimitResponse(rate.retryAfter);
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const limitParam = parseInt(searchParams.get('limit') ?? '5', 10);
  const limit = isNaN(limitParam) ? 5 : Math.min(Math.max(limitParam, 1), 100);

  if (!q) {
    return NextResponse.json({
      artists: [],
      albums: [],
      songs: [],
      topResult: null,
    });
  }

  await ensureSchema();
  const data = await executeSearch(q, limit);
  return NextResponse.json(data);
}
