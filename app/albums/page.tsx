import MediaCard from '@/components/MediaCard';
import Reveal from '@/components/Reveal';
import { ensureSchema, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AlbumsPage() {
  await ensureSchema();
  const [rows] = await pool.query<any[]>(
    `SELECT al.id, al.name, al.year, al.artwork, a.name AS artist
     FROM albums al JOIN artists a ON al.artist_id = a.id
     ORDER BY al.name`
  );
  const [songs] = await pool.query<any[]>(
    `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
            s.album_id, al.name AS album, ar.name AS artist, al.artwork
     FROM songs s
     JOIN albums al ON s.album_id = al.id
     JOIN artists ar ON al.artist_id = ar.id
     ORDER BY s.album_id, s.disc_no, s.track_no`
  );
  // group by album id
  const byAlbum = new Map<number, any[]>();
  for (const s of songs) {
    if (!byAlbum.has(s.album_id)) byAlbum.set(s.album_id, []);
    byAlbum.get(s.album_id)!.push(s);
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Albums</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {rows.map((al, i) => (
          <Reveal key={al.id} delayMs={i * 40}>
            <MediaCard href={`/albums/${al.id}`} artwork={al.artwork} title={al.name} subtitle={al.artist} songs={byAlbum.get(al.id)} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}