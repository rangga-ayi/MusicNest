'use client';
import { usePlayer } from './PlayerProvider';
import { fmtDuration } from '@/lib/format';
import AudioBadge from './AudioBadge';

const ICON = {
  prev: <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />,
  next: <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />,
  play: <path d="M8 5v14l11-7z" />,
  pause: <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  volume: <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />,
  mute: <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM18.36 7.2l-1.41 1.41A3 3 0 0 1 17.5 12a3 3 0 0 1-.55 3.39l1.41 1.41A5 5 0 0 0 19.5 12a5 5 0 0 0-1.14-4.8z" />,
  shuffle: <path d="M16 3h5v5l-2.5-2.5-3.2 3.2-1.4-1.4 3.2-3.2L16 3zM3 5h3a8 8 0 0 1 6 2.7l2.4 2.9A8 8 0 0 0 9 19H3v-2h6a6 6 0 0 0 4.5-2l2.4-2.9a8 8 0 0 1 6-2.1h.1V8a6 6 0 0 0-4.5 2l-2.4 2.9A8 8 0 0 0 9 7H3V5z" />,
  repeat: <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />,
  repeat1: <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-6-2V9h-2l-1 .8v1.8l.9-.6h.1v4.9h2z" />,
};

function Icon({ name, size = 20 }: { name: keyof typeof ICON; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {ICON[name]}
    </svg>
  );
}

export default function PlayerBar({ onExpand }: { onExpand?: () => void }) {
  const p = usePlayer();
  if (!p.current) return null;
  const progress = p.duration ? (p.currentTime / p.duration) * 100 : 0;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:z-40">
      {/* Mobile: compact bar di atas bottom-nav */}
      <div className="md:hidden fixed bottom-[62px] inset-x-0 flex items-center gap-3 px-3.5 pt-2.5 pb-2 border-t border-white/[0.08] bg-[#0c0c10]/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <button onClick={onExpand} className="flex items-center gap-3 min-w-0 flex-1 text-left group">
          <div className="relative shrink-0">
            {p.current.artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/artwork/${p.current.artwork}`} alt="" className={`h-11 w-11 rounded-full object-cover ring-1 ring-white/10 ${p.isPlaying ? 'vinyl-spin' : ''}`} />
            ) : (
              <div className="h-11 w-11 rounded-full bg-surface-hover ring-1 ring-white/10" />
            )}
            {p.isPlaying && (
              <span className="absolute inset-0 rounded-full ring-1 ring-black/40" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:underline">{p.current.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="truncate text-xs text-muted">{p.current.artist}</p>
              <AudioBadge format={p.current.format} sampleRate={p.current.sample_rate} bitrate={p.current.bitrate} size="xs" />
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => p.playPrev()} aria-label="Lagu sebelumnya" className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer active:scale-90">
            <Icon name="prev" />
          </button>
          <button onClick={p.toggle} aria-label={p.isPlaying ? 'Jeda' : 'Putar'} className="rounded-full bg-accent text-on-accent p-2.5 hover:bg-accent-hover active:scale-90 transition-all cursor-pointer shadow-lg shadow-accent/25">
            <Icon name={p.isPlaying ? 'pause' : 'play'} size={22} />
          </button>
          <button onClick={() => p.playNext()} aria-label="Lagu berikutnya" className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer active:scale-90">
            <Icon name="next" />
          </button>
        </div>
      </div>

      {/* Desktop: full bar */}
      <div className="hidden md:flex items-center gap-4 px-5 py-3 border-t border-white/[0.08] bg-[#0c0c10]/85 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
        {/* kiri: info + vinyl + audio badge */}
        <button onClick={onExpand} className="flex items-center gap-3.5 min-w-0 w-[28%] text-left group">
          <div className="relative shrink-0">
            {p.current.artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/artwork/${p.current.artwork}`} alt="" className={`h-12 w-12 rounded-full object-cover ring-1 ring-white/10 shadow-md ${p.isPlaying ? 'vinyl-spin' : ''}`} />
            ) : (
              <div className="h-12 w-12 rounded-full bg-surface-hover ring-1 ring-white/10" />
            )}
            {p.isPlaying && (
              <span className="absolute inset-0 rounded-full ring-1 ring-black/40" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground group-hover:underline">{p.current.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="truncate text-xs text-muted">{p.current.artist}</p>
              <AudioBadge format={p.current.format} sampleRate={p.current.sample_rate} bitrate={p.current.bitrate} size="xs" />
            </div>
          </div>
        </button>

        {/* tengah: shuffle, controls, repeat + seek */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button onClick={p.toggleShuffle} aria-label="Acak" aria-pressed={p.shuffle}
              className={`relative p-1 transition-colors cursor-pointer ${p.shuffle ? 'text-accent' : 'text-muted hover:text-foreground'}`}>
              <Icon name="shuffle" size={18} />
              <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full bg-accent ${p.shuffle ? 'opacity-100' : 'opacity-0'}`} />
            </button>
            <button onClick={() => p.playPrev()} aria-label="Lagu sebelumnya" className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
              <Icon name="prev" />
            </button>
            <button onClick={p.toggle} aria-label={p.isPlaying ? 'Jeda' : 'Putar'} className="rounded-full bg-accent text-on-accent p-2.5 hover:bg-accent-hover hover:scale-105 active:scale-90 transition-all cursor-pointer">
              <Icon name={p.isPlaying ? 'pause' : 'play'} size={22} />
            </button>
            <button onClick={() => p.playNext()} aria-label="Lagu berikutnya" className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
              <Icon name="next" />
            </button>
            <button onClick={p.cycleRepeat} aria-label="Ulangi" aria-pressed={p.repeat !== 'off'}
              className={`relative p-1 transition-colors cursor-pointer ${p.repeat !== 'off' ? 'text-accent' : 'text-muted hover:text-foreground'}`}>
              <Icon name={p.repeat === 'one' ? 'repeat1' : 'repeat'} size={18} />
              <span aria-hidden="true" className={`absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full bg-accent ${p.repeat !== 'off' ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-lg text-xs text-muted tabular-nums">
            <span>{fmtDuration(p.currentTime * 1000)}</span>
            <input
              type="range" min={0} max={p.duration || 0} step={0.1} value={p.currentTime}
              onChange={(e) => p.seek(Number(e.target.value))}
              className="flex-1 progress"
              style={{ ['--progress' as string]: `${progress}%` }}
              aria-label="Posisi lagu"
            />
            <span>{fmtDuration(p.duration * 1000)}</span>
          </div>
        </div>

        {/* kanan: volume + expand */}
        <div className="flex items-center gap-2 w-[22%] justify-end text-muted">
          <button onClick={p.toggleMute} aria-label={p.muted ? 'Nyalakan suara' : 'Bisukan'} className="hover:text-foreground p-1 cursor-pointer">
            <Icon name={p.muted ? 'mute' : 'volume'} size={18} />
          </button>
          <input type="range" min={0} max={1} step={0.01} value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="w-24" aria-label="Volume" />
          <button onClick={onExpand} aria-label="Buka player penuh" className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer">
            <Icon name="expand" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}