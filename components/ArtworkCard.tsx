'use client';
import Image from 'next/image';

interface ArtworkCardProps {
  artwork: string | null;
  alt: string;
  size?: number;
  radius?: string;
  className?: string;
  priority?: boolean;
  onPlay?: () => void;
  isPlaying?: boolean;
}

/** Cover dengan placeholder fallback + hover scale (Spotify-style card). */
export default function ArtworkCard({
  artwork,
  alt,
  size,
  radius = 'rounded-xl',
  className = '',
  priority = false,
  onPlay,
  isPlaying = false,
}: ArtworkCardProps) {
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, flexShrink: 0 } : undefined;
  const cls = `relative aspect-square overflow-hidden ${radius} bg-gradient-to-br from-surface-hover to-surface border border-white/[0.06] transition-transform duration-300 group-hover:scale-[1.03] shadow-md shadow-black/30 ${className} ${!size && !className ? 'w-full' : ''}`;

  return (
    <div className={cls} style={sizeStyle}>
      {!artwork ? (
        <div className="h-full w-full flex items-center justify-center text-muted" aria-label={alt}>
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
      ) : (
        <Image
          src={`/api/artwork/${artwork}`}
          alt={alt}
          width={size || 300}
          height={size || 300}
          priority={priority}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {onPlay && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPlay();
          }}
          aria-label={isPlaying ? `Jeda ${alt}` : `Putar ${alt}`}
          className="absolute bottom-3 right-3 rounded-full bg-accent text-on-accent p-3 shadow-2xl shadow-black/80 hover:shadow-accent/40 opacity-0 translate-y-3 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 hover:scale-110 active:scale-95 focus-visible:opacity-100 transition-all duration-300 ease-out cursor-pointer z-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {isPlaying ? (
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}