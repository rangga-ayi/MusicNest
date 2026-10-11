import { NextRequest } from 'next/server';
import { ensureSchema, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 500), 1000);
    const [rows] = await pool.query<any[]>(
      `SELECT s.id, s.title, s.duration_ms, s.track_no, s.disc_no, s.format, s.bitrate, s.sample_rate, s.album_id,
              al.name AS album, ar.name AS artist, al.artwork
       FROM songs s
       JOIN albums al ON s.album_id = al.id
       JOIN artists ar ON al.artist_id = ar.id
       ORDER BY RAND()
       LIMIT ?`,
      [limit]
    );
    return Response.json(rows);
  } catch (err) {
    console.error('Failed to fetch random songs:', err);
    return Response.json({ error: 'Failed to fetch random songs' }, { status: 500 });
  }
}
