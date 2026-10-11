import { notFound } from 'next/navigation';
import { ensureSchema, pool } from '@/lib/db';
import { getFavIds } from '@/lib/favorites';
import SongList from '@/components/SongList';
import AddSongs from './AddSongs';
import DeletePlaylist from './DeletePlaylist';
import PlaylistSongs from './PlaylistSongs';

export const dynamic = 'force-dynamic';

export default async function PlaylistDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await ensureSchema();
  const [pl] = await pool.query<any[]>('SELECT id, name FROM playlists WHERE id = ?', [id]);
  if (!pl[0]) notFound();
  const [songs] = await pool.query<any[]>(
    `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
            al.name AS album, ar.name AS artist, al.artwork
     FROM playlist_songs ps
     JOIN songs s ON s.id = ps.song_id
     JOIN albums al ON s.album_id = al.id
     JOIN artists ar ON al.artist_id = ar.id
     WHERE ps.playlist_id = ?
     ORDER BY ps.position`, [id]
  );
  const favs = await getFavIds();
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/50 backdrop-blur-xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-black/30">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">{pl[0].name}</h1>
          <p className="text-muted text-sm mt-1">{songs.length} lagu</p>
        </div>
        <div className="flex items-center gap-2.5">
          <AddSongs playlistId={id} current={songs.map((s: any) => s.id)} />
          <DeletePlaylist id={id} name={pl[0].name} />
        </div>
      </div>
      {songs.length === 0
        ? <p className="text-muted text-sm">Playlist kosong. Tambah lagu dari album.</p>
        : <PlaylistSongs songs={songs} favs={favs} playlistId={id} />
      }
    </div>
  );
}