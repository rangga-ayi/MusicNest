'use client';

import { usePlayer } from './PlayerProvider';
import { fmtDuration } from '@/lib/format';
import FavButton from './FavButton';
import AudioBadge from './AudioBadge';
import type { Song } from '@/lib/types';

export default function SongList({
  songs,
  showAlbum = false,
  favs,
  removable,
  onRemove,
}: {
  songs: Song[];
  showAlbum?: boolean;
  favs?: Set<number>;
  removable?: boolean;
  onRemove?: (songId: number) => void;
}) {
  const p = usePlayer();
  const activeId = p.current?.id;

  return (
    <div className="w-full">
      {songs.length > 1 && (
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => p.setQueueAndPlay(songs, 0)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-on-accent hover:bg-accent-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Putar Semua
          </button>
          <span className="text-xs text-muted font-medium">
            {songs.length} lagu
          </span>
        </div>
      )}

      {/* Tabel Presisi Tracklist — Header */}
      {songs.length > 0 && (
        <div className={`grid grid-cols-[36px_1fr_auto] ${showAlbum ? 'md:grid-cols-[36px_1fr_1fr_auto]' : ''} items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted/60 border-b border-white/[0.08] mb-1 select-none`}>
          <div className="text-center font-mono">#</div>
          <div>Judul</div>
          {showAlbum && <div className="hidden md:block">Album</div>}
          <div className="w-24 text-right flex items-center justify-end pr-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Durasi">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      )}

      {/* Daftar Baris Track */}
      <div className="space-y-0.5">
        {songs.map((s, i) => {
          const isActive = activeId === s.id;
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => p.setQueueAndPlay(songs, i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  p.setQueueAndPlay(songs, i);
                }
              }}
              className={`group grid grid-cols-[36px_1fr_auto] ${showAlbum ? 'md:grid-cols-[36px_1fr_1fr_auto]' : ''} items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'bg-accent/[0.12] text-accent font-medium border border-accent/20 shadow-sm'
                  : 'hover:bg-white/[0.05] active:bg-white/[0.08]'
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* Kolom 1: Nomor lagu / Equalizer aktif / Play hover */}
              <div className="flex items-center justify-center shrink-0 w-9">
                {isActive && p.isPlaying ? (
                  <span className="flex items-end gap-[2px] h-4 group-hover:hidden" aria-label="Sedang diputar">
                    <span className="eq-bar w-[3px] h-4 bg-accent rounded-sm" style={{ animationDelay: '0ms' }} />
                    <span className="eq-bar w-[3px] h-4 bg-accent rounded-sm" style={{ animationDelay: '150ms' }} />
                    <span className="eq-bar w-[3px] h-4 bg-accent rounded-sm" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : (
                  <span className={`text-sm tabular-nums font-mono group-hover:hidden ${isActive ? 'text-accent font-bold' : 'text-muted'}`}>
                    {s.track_no ?? i + 1}
                  </span>
                )}
                <span className="hidden group-hover:inline-flex items-center justify-center text-foreground group-hover:text-accent transition-transform transform active:scale-90">
                  {isActive && p.isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </span>
              </div>

              {/* Kolom 2: Judul & Artis */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {showAlbum && (
                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-surface-hover border border-white/[0.06]">
                    {s.artwork ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/artwork/${s.artwork}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${isActive ? 'text-accent font-semibold' : 'text-foreground font-medium'}`}>
                      {s.title}
                    </p>
                    <AudioBadge format={s.format} sampleRate={s.sample_rate} bitrate={s.bitrate} size="xs" />
                  </div>
                  <p className="truncate text-xs text-muted mt-0.5">{s.artist}</p>
                </div>
              </div>

              {/* Kolom 3: Album (jika showAlbum) */}
              {showAlbum && (
                <div className="hidden md:block min-w-0 text-sm text-muted truncate pr-3">
                  {s.album}
                </div>
              )}

              {/* Kolom 4: Actions & Durasi dengan tabular-nums */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-end w-24">
                <div onClick={(e) => e.stopPropagation()}>
                  <FavButton songId={s.id} initial={favs?.has(s.id) ?? false} />
                </div>
                {removable && onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(s.id);
                    }}
                    aria-label={`Hapus ${s.title} dari playlist`}
                    className="p-1 text-muted hover:text-destructive transition-colors cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
                <span className="text-xs sm:text-sm font-mono tabular-nums text-muted text-right min-w-[44px]">
                  {fmtDuration(s.duration_ms)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}