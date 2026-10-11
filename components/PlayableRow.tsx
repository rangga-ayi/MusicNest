'use client';

import { usePlayer } from './PlayerProvider';
import { fmtDuration } from '@/lib/format';
import AudioBadge from './AudioBadge';
import Image from 'next/image';
import type { Song } from '@/lib/types';

/** RSC-safe: row renderable from server data, wired to the client player. */
export default function PlayableRow({ song }: { song: Song }) {
  const p = usePlayer();
  const isActive = p.current?.id === song.id;

  return (
    <button
      onClick={() => p.playSong(song)}
      className={`group w-full flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200 card-hover text-left cursor-pointer shadow-md shadow-black/20 ${
        isActive
          ? 'bg-accent/[0.12] border-accent/20 text-accent font-medium'
          : 'bg-surface/75 hover:bg-surface-hover/80 border-white/[0.05] hover:border-white/[0.1]'
      }`}
    >
      <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-surface-hover border border-white/[0.06]">
        {song.artwork ? (
          <Image
            src={`/api/artwork/${song.artwork}`}
            alt={song.title}
            width={48}
            height={48}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`truncate text-sm font-semibold ${isActive ? 'text-accent' : 'text-foreground group-hover:text-accent transition-colors'}`}>
            {song.title}
          </p>
          <AudioBadge format={song.format} sampleRate={song.sample_rate} bitrate={song.bitrate} size="xs" />
        </div>
        <p className="text-xs text-muted truncate mt-0.5">{song.artist} · {song.album}</p>
      </div>

      <span className="text-xs sm:text-sm font-mono tabular-nums text-muted shrink-0 pr-1">
        {fmtDuration(song.duration_ms)}
      </span>
    </button>
  );
}
