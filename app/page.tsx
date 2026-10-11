import { ensureSchema, pool } from '@/lib/db';
import ArtworkCard from '@/components/ArtworkCard';
import MediaCard from '@/components/MediaCard';
import HeroPlay from '@/components/HeroPlay';
import PlayableRow from '@/components/PlayableRow';
import Reveal from '@/components/Reveal';
import { fmtTotalDuration } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await ensureSchema();
  const [[albums], [recent], [statsRows]] = await Promise.all([
    pool.query<any[]>(
      `SELECT al.id, al.name, al.artwork, a.name AS artist
       FROM albums al JOIN artists a ON al.artist_id = a.id
       ORDER BY RAND() LIMIT 13`
    ),
    pool.query<any[]>(
      `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
              al.name AS album, ar.name AS artist, al.artwork
       FROM songs s
       JOIN albums al ON s.album_id = al.id
       JOIN artists ar ON al.artist_id = ar.id
       ORDER BY s.id DESC LIMIT 8`
    ),
    pool.query<any[]>(
      `SELECT
         (SELECT COUNT(*) FROM songs) AS total_songs,
         (SELECT COUNT(*) FROM albums) AS total_albums,
         (SELECT COUNT(*) FROM artists) AS total_artists,
         (SELECT COALESCE(SUM(duration_ms), 0) FROM songs) AS total_duration_ms`
    ),
  ]);

  const stats = statsRows[0] ?? {
    total_songs: 0,
    total_albums: 0,
    total_artists: 0,
    total_duration_ms: 0,
  };

  const ids = albums.map((a) => a.id);
  const allSongs = ids.length
    ? (await pool.query<any[]>(
        `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
                s.album_id, al.name AS album, ar.name AS artist, al.artwork
         FROM songs s
         JOIN albums al ON s.album_id = al.id
         JOIN artists ar ON al.artist_id = ar.id
         WHERE s.album_id IN (${ids.map(() => '?').join(',')})
         ORDER BY s.disc_no, s.track_no`, ids
      ))[0]
    : []; // library kosong → hindari `IN ()` yang bikin syntax error MySQL
  const byAlbum = new Map<number, any[]>();
  for (const s of allSongs) {
    if (!byAlbum.has(s.album_id)) byAlbum.set(s.album_id, []);
    byAlbum.get(s.album_id)!.push(s);
  }
  const hero = albums[0];

  return (
    <div className="space-y-12">
      {/* Hero dengan Ambient Gradient Glow */}
      {hero && (
        <Reveal>
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface/50 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-black/40">
            {/* ambient artwork glow */}
            {hero.artwork ? (
              <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/artwork/${hero.artwork}`}
                  alt=""
                  className="w-full h-full object-cover blur-3xl scale-150 opacity-30 transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-surface/85 to-surface/40" />
              </div>
            ) : (
              <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
              </div>
            )}
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
              <div className="relative group float-slow shrink-0">
                <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                <ArtworkCard
                  artwork={hero.artwork}
                  alt={hero.name}
                  className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 shrink-0 shadow-2xl shadow-black/80 ring-1 ring-white/10"
                  radius="rounded-2xl"
                  priority
                />
              </div>
              <div className="flex-1 pb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Unggulan</p>
                <h1 className="text-3xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight font-extrabold text-white">
                  Selamat datang di <span className="text-gradient">Music Nest</span>
                </h1>
                <p className="text-muted mt-4 max-w-lg leading-relaxed text-sm sm:text-base">Pustaka musik pribadi kamu — siap diputar.</p>
                <div className="mt-6 flex gap-3">
                  <HeroPlay songs={byAlbum.get(hero.id) ?? []} albumName={hero.name} />
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Library Stats Bar */}
      <Reveal>
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/[0.06] bg-surface/70 backdrop-blur-sm p-4 flex items-center gap-3.5 shadow-md shadow-black/20 hover:border-white/[0.1] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">Total Lagu</p>
              <p className="text-lg font-semibold tracking-tight">{stats.total_songs}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-surface/70 backdrop-blur-sm p-4 flex items-center gap-3.5 shadow-md shadow-black/20 hover:border-white/[0.1] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">Total Album</p>
              <p className="text-lg font-semibold tracking-tight">{stats.total_albums}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-surface/70 backdrop-blur-sm p-4 flex items-center gap-3.5 shadow-md shadow-black/20 hover:border-white/[0.1] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">Total Artis</p>
              <p className="text-lg font-semibold tracking-tight">{stats.total_artists}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-surface/70 backdrop-blur-sm p-4 flex items-center gap-3.5 shadow-md shadow-black/20 hover:border-white/[0.1] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium">Durasi Koleksi</p>
              <p className="text-lg font-semibold tracking-tight">{fmtTotalDuration(Number(stats.total_duration_ms))}</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Random albums */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pilihan Album</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {albums.map((al, i) => (
            <Reveal key={al.id} delayMs={i * 40}>
              <MediaCard
                href={`/albums/${al.id}`}
                artwork={al.artwork}
                title={al.name}
                subtitle={al.artist}
                songs={byAlbum.get(al.id)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Terbaru</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {recent.map((s) => (
            <PlayableRow key={s.id} song={s} />
          ))}
        </div>
      </section>
    </div>
  );
}