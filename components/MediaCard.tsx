'use client';
import Link from 'next/link';
import ArtworkCard from './ArtworkCard';
import { usePlayer } from './PlayerProvider';
import type { Song } from '@/lib/types';

interface Props {
  href: string;
  artwork: string | null;
  title: string;
  subtitle?: string | null;
  songs?: Song[];
  playIndex?: number;
  priority?: boolean;
}

/** Kartu album/artist seragam. Hover → tombol play (accent circle). */
export default function MediaCard({ href, artwork, title, subtitle, songs, playIndex = 0, priority = false }: Props) {
  const p = usePlayer();
  const canPlay = !!songs?.length;
  return (
    <Link href={href} className="group relative flex flex-col w-full rounded-2xl p-3 bg-surface/75 hover:bg-surface-hover/80 border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 card-hover active:scale-[0.98] shadow-lg shadow-black/30 backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-xl">
        <ArtworkCard artwork={artwork} alt={title} priority={priority} />
        {canPlay && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              p.setQueueAndPlay(songs!, playIndex);
            }}
            aria-label={`Putar ${title}`}
            className="absolute bottom-3 right-3 rounded-full bg-accent text-on-accent p-3.5 shadow-2xl shadow-black/80 hover:shadow-accent/40 opacity-0 translate-y-3 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 hover:scale-110 active:scale-95 focus-visible:opacity-100 transition-all duration-300 ease-out cursor-pointer z-10 play-on-hover"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-3 font-semibold text-sm truncate text-foreground group-hover:text-accent transition-colors">{title}</p>
      {subtitle && <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>}
    </Link>
  );
}