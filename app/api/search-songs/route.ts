import { NextRequest } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { executeSearch } from '@/lib/search';
import { searchLimiter, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rate = searchLimiter.check(req);
  if (!rate.success) {
    return rateLimitResponse(rate.retryAfter);
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return Response.json([]);
  await ensureSchema();
  const data = await executeSearch(q, 20);
  return Response.json(data.songs);
}