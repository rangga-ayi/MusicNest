import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ensureSchema, pool } from '@/lib/db';
import { getFavIds } from '@/lib/favorites';
import ArtworkCard from '@/components/ArtworkCard';
import SongList from '@/components/SongList';
import AudioBadge from '@/components/AudioBadge';
import { getAudioBadge, AudioBadgeType } from '@/lib/audioBadge';
import { fmtDuration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AlbumDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const albumId = Number(id);
  await ensureSchema();
  const [info] = await pool.query<any[]>(
    `SELECT al.id, al.name, al.year, al.artwork, al.artist_id, a.name AS artist
     FROM albums al JOIN artists a ON al.artist_id = a.id WHERE al.id = ?`,
    [albumId]
  );
  if (!info[0]) notFound();
  const al = info[0];

  const [songs] = await pool.query<any[]>(
    `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
            al.name AS album, a.name AS artist, al.artwork
     FROM songs s
     JOIN albums al ON s.album_id = al.id
     JOIN artists a ON al.artist_id = a.id
     WHERE s.album_id = ? ORDER BY s.disc_no, s.track_no, s.id`,
    [albumId]
  );
  const totalDur = songs.reduce((s: number, x: any) => s + (x.duration_ms ?? 0), 0);
  const favs = await getFavIds();

  // Evaluasi tingkatan kualitas audio terbaik di dalam album
  let bestBadge: AudioBadgeType = null;
  let representativeSampleRate: number | null = null;
  for (const s of songs) {
    const badge = getAudioBadge(s.format, s.sample_rate, s.bitrate);
    if (badge === 'HI-RES') {
      bestBadge = 'HI-RES';
      representativeSampleRate = s.sample_rate;
      break;
    }
    if (badge === 'LOSSLESS') {
      bestBadge = 'LOSSLESS';
      representativeSampleRate = s.sample_rate;
    } else if (badge === 'AAC' && !bestBadge) {
      bestBadge = 'AAC';
    } else if (badge === 'MP3' && !bestBadge) {
      bestBadge = 'MP3';
    }
  }

  return (
    <div>
      <nav className="text-sm text-muted mb-4" aria-label="Breadcrumb">
        <Link href="/artists" className="hover:text-foreground transition-colors">Artis</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/artists/${al.artist_id}`} className="hover:text-foreground transition-colors">{al.artist}</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground font-medium">{al.name}</span>
      </nav>

      {/* Hero Header Album dengan Ambient Gradient Glow */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/50 backdrop-blur-xl p-6 sm:p-10 mb-8 shadow-2xl shadow-black/40">
        {/* Ambient glow dari artwork album */}
        {al.artwork && (
          <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/artwork/${al.artwork}`}
              alt=""
              className="w-full h-full object-cover blur-3xl scale-150 opacity-35 transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-surface/85 to-surface/40" />
          </div>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 text-center sm:text-left">
          <div className="relative shrink-0 group">
            <div className="absolute -inset-3 rounded-3xl bg-accent/15 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <ArtworkCard
              artwork={al.artwork}
              alt={al.name}
              className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-52 md:h-52 shrink-0 shadow-2xl shadow-black/80 ring-1 ring-white/10"
              radius="rounded-2xl"
              priority
            />
          </div>

          <div className="pb-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                Album
              </span>
              {bestBadge && (
                <AudioBadge
                  format={bestBadge === 'HI-RES' ? 'flac' : bestBadge.toLowerCase()}
                  sampleRate={representativeSampleRate ?? (bestBadge === 'HI-RES' ? 96000 : 44100)}
                  size="sm"
                />
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {al.name}
            </h1>

            <p className="text-muted text-sm sm:text-base mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-semibold text-foreground">{al.artist}</span>
              {al.year && <span>· {al.year}</span>}
              <span>· {songs.length} lagu</span>
              <span>· {fmtDuration(totalDur)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Tracklist Presisi */}
      <SongList songs={songs} favs={favs} />
    </div>
  );
}