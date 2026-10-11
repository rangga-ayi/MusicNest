'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePlayer } from './PlayerProvider';
import { fmtDuration } from '@/lib/format';
import { parseLrc } from '@/lib/lyrics';
import type { LrcLine } from '@/lib/lyrics';
import type { SongMeta } from '@/lib/types';
import PlaylistPickerModal from './PlaylistPickerModal';
import AudioBadge from './AudioBadge';

/* ─────────────────────── helpers ─────────────────────── */

function fmtBytes(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function fmtHz(hz: number | null): string {
  if (!hz) return '-';
  return hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${hz} Hz`;
}

/** bitrate dari music-metadata adalah bps; tampilkan sebagai kbps. */
function fmtKbps(bps: number | null): string {
  if (!bps) return '-';
  return `${(bps / 1000).toFixed(1)} kbps`;
}

/* ─────────────────────── ikon kecil ─────────────────────── */

const ICON = {
  prev:      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />,
  next:      <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />,
  play:      <path d="M8 5v14l11-7z" />,
  pause:     <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />,
  shuffle:   <path d="M16 3h5v5l-2.5-2.5-3.2 3.2-1.4-1.4 3.2-3.2L16 3zM3 5h3a8 8 0 0 1 6 2.7l2.4 2.9A8 8 0 0 0 9 19H3v-2h6a6 6 0 0 0 4.5-2l2.4-2.9a8 8 0 0 1 6-2.1h.1V8a6 6 0 0 0-4.5 2l-2.4 2.9A8 8 0 0 0 9 7H3V5z" />,
  repeat:    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />,
  repeat1:   <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-6-2V9h-2l-1 .8v1.8l.9-.6h.1v4.9h2z" />,
  heart:     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
  heartLine: <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />,
  listPlus:  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7zm9 6v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z" />,
  volume:    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />,
  mute:      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM18.36 7.2l-1.41 1.41A3 3 0 0 1 17.5 12a3 3 0 0 1-.55 3.39l1.41 1.41A5 5 0 0 0 19.5 12a5 5 0 0 0-1.14-4.8z" />,
  close:     <path d="M6 6l12 12M18 6L6 18" />,
  queue:     <path d="M4 6h16v2H4V6zm4 5h12v2H8v-2zm4 5h8v2h-8v-2z" />,
  chevLeft:  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />,
  chevRight: <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />,
};

function Ico({
  name, size = 22, fill = true,
}: {
  name: keyof typeof ICON;
  size?: number;
  fill?: boolean;
}) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={fill ? undefined : 2}
      strokeLinecap={fill ? undefined : 'round'}
      aria-hidden="true"
    >
      {ICON[name]}
    </svg>
  );
}

/* ─────────────────────── komponen utama ─────────────────────── */

export default function FullPlayer({ onClose }: { onClose: () => void }) {
  const p = usePlayer();

  /* Slide */
  const [slide, setSlide] = useState(0); // 0=cover, 1=lirik, 2=metadata
  const touchStartX = useRef<number | null>(null);

  /* Lebar container slider dalam piksel (untuk translateX yang presisi) */
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const [containerPx, setContainerPx] = useState(0);
  useEffect(() => {
    const el = sliderContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerPx(el.clientWidth));
    ro.observe(el);
    setContainerPx(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /* Lirik */
  const [lyrics, setLyrics] = useState<LrcLine[] | null>(null);
  const lyricBox = useRef<HTMLDivElement>(null);
  const activeIdx = lyrics?.findLastIndex((l) => l.timeMs <= p.currentTime * 1000) ?? -1;

  /* Metadata (Slide 3) */
  const [meta, setMeta] = useState<SongMeta | null>(null);

  /* Favorit */
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  /* Playlist modal */
  const [showPlaylist, setShowPlaylist] = useState(false);

  /* Toast lokal */
  const [localToast, setLocalToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    setLocalToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setLocalToast(null), 3000);
  }

  /* ── Fetch lirik saat lagu berubah ── */
  useEffect(() => {
    setLyrics(null);
    if (!p.current) return;
    fetch(`/api/lyrics/${p.current.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((lines) => setLyrics(lines))
      .catch(() => setLyrics([]));
  }, [p.current]);

  /* ── Fetch metadata saat lagu berubah ── */
  useEffect(() => {
    setMeta(null);
    if (!p.current) return;
    fetch(`/api/song/${p.current.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMeta)
      .catch(() => setMeta(null));
  }, [p.current]);

  /* ── Fetch status favorit saat lagu berubah ── */
  useEffect(() => {
    if (!p.current) return;
    fetch(`/api/favorite/${p.current.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setIsFavorite(d.favorite))
      .catch(() => setIsFavorite(false));
  }, [p.current]);

  /* ── Auto-scroll lirik ── */
  useEffect(() => {
    if (slide !== 1) return;
    if (activeIdx >= 0 && lyricBox.current) {
      const el = lyricBox.current.children[activeIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeIdx, slide]);

  /* ── Keyboard shortcut (Escape, ArrowLeft, ArrowRight) ── */
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0));
      else if (e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, 2));
    },
    [onClose],
  );
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  /* ── Focus management ── */
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    return () => prev?.focus?.();
  }, []);

  /* ── Toggle favorit ── */
  async function toggleFav() {
    if (!p.current || favLoading) return;
    setFavLoading(true);
    try {
      const r = await fetch(`/api/favorite/${p.current.id}`, { method: 'POST' });
      const d = await r.json();
      setIsFavorite(d.favorite);
      showToast(d.favorite ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit');
    } catch {
      showToast('Gagal mengubah favorit');
    } finally {
      setFavLoading(false);
    }
  }

  /* ── Touch (mobile swipe) ── */
  function onTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 35) return;
    if (dx < 0) setSlide((s) => Math.min(s + 1, 2));
    else setSlide((s) => Math.max(s - 1, 0));
  }

  /* ── Mouse Drag (desktop only) ── */
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return; // touch ditangani onTouchStart
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    touchStartX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    if (touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 35) return;
    if (dx < 0) setSlide((s) => Math.min(s + 1, 2));
    else setSlide((s) => Math.max(s - 1, 0));
  }

  /* ── Format kualitas audio ── */
  const qualityStr = useMemo(() => {
    if (!meta) return null;
    const parts: string[] = [];
    if (meta.sample_rate) parts.push(fmtHz(meta.sample_rate));
    if (meta.bitrate) parts.push(fmtKbps(meta.bitrate));
    if (meta.format) parts.push(meta.format.toUpperCase());
    return parts.join(' · ') || null;
  }, [meta]);

  if (!p.current) return null;
  const c = p.current;
  const artworkUrl = c.artwork ? `/api/artwork/${c.artwork}` : null;

  /* ─────────────── RENDER ─────────────── */
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Player penuh"
      style={{ background: 'var(--background)' }}
    >
      {/* ── Background blur dari artwork ── */}
      {artworkUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-110"
            style={{ filter: 'blur(60px)', opacity: 0.25 }}
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
      )}

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <button
          ref={closeBtn}
          onClick={onClose}
          className="rounded-full p-2 text-muted hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Tutup player"
        >
          <Ico name="close" size={22} fill={false} />
        </button>

        <div className="text-center min-w-0 flex-1 px-3">
          <p className="text-xs text-muted/70 truncate">{c.artist} · {c.album}</p>
        </div>

        {/* tombol kanan header: queue (placeholder visual) */}
        <button
          className="rounded-full p-2 text-muted/40 cursor-default"
          aria-label="Antrian"
          title="Antrian"
        >
          <Ico name="queue" size={20} />
        </button>
      </div>

      {/* ── Slides area ── */}
      <div
        ref={sliderContainerRef}
        className="relative z-10 flex-1 w-full overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* Navigasi Desktop: Panah Kiri */}
        {slide > 0 && (
          <button
            onClick={() => setSlide((s) => s - 1)}
            aria-label="Slide sebelumnya"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur items-center justify-center text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-lg hover:scale-110 active:scale-95"
          >
            <Ico name="chevLeft" size={24} />
          </button>
        )}

        {/* Navigasi Desktop: Panah Kanan */}
        {slide < 2 && (
          <button
            onClick={() => setSlide((s) => s + 1)}
            aria-label="Slide berikutnya"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur items-center justify-center text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-lg hover:scale-110 active:scale-95"
          >
            <Ico name="chevRight" size={24} />
          </button>
        )}

        {/* Slider track — pixel-based agar 100% presisi di semua browser */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: containerPx ? `${containerPx * 3}px` : '300%',
            transform: `translateX(${-slide * (containerPx || 0)}px)`,
          }}
        >

          {/* ════════ SLIDE 1 — COVER ════════ */}
          <div
            className="h-full shrink-0 flex-none flex flex-col items-center justify-center gap-5 px-6"
            style={{ width: containerPx ? `${containerPx}px` : '33.333%' }}
          >
            {artworkUrl ? (
              <div className="relative float-slow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artworkUrl}
                  alt={`Sampul ${c.album}`}
                  className={`size-60 sm:size-72 rounded-full object-cover shadow-2xl shadow-black/60 ${
                    p.isPlaying ? 'vinyl-spin' : ''
                  }`}
                />
                {/* Lubang tengah vinyl */}
                <div
                  className="absolute inset-0 m-auto h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
                  aria-hidden="true"
                >
                  <div className="h-3 w-3 rounded-full bg-accent" />
                </div>
                {/* Groove rings vinyl */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 0 0 10px rgba(0,0,0,0.15), inset 0 0 0 11.5px rgba(255,255,255,0.06)',
                  }}
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div className="size-60 sm:size-72 rounded-full bg-surface-hover flex items-center justify-center text-muted shadow-2xl">
                <Ico name="play" size={80} />
              </div>
            )}

            <div className="text-center max-w-xs sm:max-w-sm px-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-balance text-white">{c.title}</h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <p className="text-muted text-xs sm:text-sm">{c.artist} — {c.album}</p>
                <AudioBadge format={c.format} sampleRate={c.sample_rate} bitrate={c.bitrate} size="xs" />
              </div>
            </div>
          </div>

          {/* ════════ SLIDE 2 — LIRIK ════════ */}
          <div
            className="h-full shrink-0 flex-none flex flex-col px-6 py-2 overflow-hidden"
            style={{ width: containerPx ? `${containerPx}px` : '33.333%' }}
          >
            <div className="flex-1 overflow-hidden relative">
              {/* Fade atas/bawah */}
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-10 z-10"
                style={{ background: 'linear-gradient(to bottom, var(--background) 0%, transparent 100%)' }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute bottom-0 inset-x-0 h-10 z-10"
                style={{ background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)' }}
                aria-hidden="true"
              />
              <div ref={lyricBox} className="h-full overflow-y-auto space-y-3 py-6 text-center scroll-smooth">
                {lyrics === null && (
                  <p className="text-muted text-sm pt-16">Memuat lirik...</p>
                )}
                {lyrics !== null && lyrics.length === 0 && (
                  <p className="text-muted text-sm pt-16">Tidak ada lirik</p>
                )}
                {lyrics?.map((l, i) => (
                  <p
                    key={i}
                    className={`transition-all duration-300 leading-relaxed ${
                      i === activeIdx
                        ? 'text-accent font-semibold text-lg sm:text-xl scale-[1.03]'
                        : i === activeIdx - 1 || i === activeIdx + 1
                        ? 'text-foreground/70 text-sm sm:text-base'
                        : 'text-muted/50 text-xs sm:text-sm'
                    }`}
                  >
                    {l.text || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* ════════ SLIDE 3 — METADATA ════════ */}
          <div
            className="h-full shrink-0 flex-none flex flex-col justify-center items-center px-6 py-2 overflow-y-auto"
            style={{ width: containerPx ? `${containerPx}px` : '33.333%' }}
          >
            {meta === null ? (
              /* Skeleton */
              <div className="w-full max-w-sm space-y-3 animate-pulse">
                <div className="h-3 w-24 rounded bg-white/10 mb-4" />
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-7 rounded-lg bg-white/10" />
                ))}
              </div>
            ) : (
              <div className="w-full max-w-sm px-2">
                <h3 className="text-xs font-semibold text-muted/60 uppercase tracking-widest mb-3">Informasi File</h3>
                <dl className="divide-y divide-white/5 border-t border-b border-white/10">
                  {[
                    ['Album', meta.album],
                    ['Artis', meta.artist],
                    ['Tahun', meta.year ?? '-'],
                    ['Durasi', fmtDuration(meta.duration_ms)],
                    ['Format', meta.format?.toUpperCase() ?? '-'],
                    ['Bitrate', fmtKbps(meta.bitrate)],
                    ['Sample Rate', fmtHz(meta.sample_rate)],
                    ['Ukuran', fmtBytes(meta.size)],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex items-center justify-between py-2 min-w-0">
                      <dt className="text-xs sm:text-sm text-muted shrink-0">{label}</dt>
                      <dd className="text-xs sm:text-sm font-medium text-right max-w-[60%] truncate ml-4">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Dot indikator slide ── */}
      <div className="relative z-10 flex justify-center gap-2 py-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className="cursor-pointer transition-all"
            aria-label={['Cover', 'Lirik', 'Metadata'][i]}
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === slide ? 'bg-accent w-5' : 'bg-white/25 w-1.5 hover:bg-white/40'
              }`}
              style={{ height: 6 }}
            />
          </button>
        ))}
      </div>

      {/* ── Kontrol ── */}
      <div className="relative z-10 px-5 pb-6 pt-1 space-y-3">

        {/* Baris aksi: repeat | favorit | playlist | shuffle */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={p.cycleRepeat}
            aria-label="Ulangi"
            aria-pressed={p.repeat !== 'off'}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              p.repeat !== 'off' ? 'text-accent' : 'text-muted hover:text-foreground'
            }`}
          >
            <Ico name={p.repeat === 'one' ? 'repeat1' : 'repeat'} size={20} />
            {p.repeat !== 'off' && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>

          <button
            onClick={toggleFav}
            disabled={favLoading}
            aria-label={isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
            aria-pressed={isFavorite}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isFavorite ? 'text-red-400 scale-110' : 'text-muted hover:text-foreground'
            } disabled:opacity-50`}
          >
            <Ico name={isFavorite ? 'heart' : 'heartLine'} size={22} />
          </button>

          <button
            onClick={() => setShowPlaylist(true)}
            aria-label="Tambah ke Playlist"
            className="p-2 rounded-full text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Ico name="listPlus" size={22} />
          </button>

          <button
            onClick={p.toggleShuffle}
            aria-label="Acak"
            aria-pressed={p.shuffle}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              p.shuffle ? 'text-accent' : 'text-muted hover:text-foreground'
            }`}
          >
            <Ico name="shuffle" size={20} />
            {p.shuffle && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-3 text-xs text-muted tabular-nums">
          <span className="w-9 text-right">{fmtDuration(p.currentTime * 1000)}</span>
          <input
            type="range"
            min={0}
            max={p.duration || 0}
            step={0.1}
            value={p.currentTime}
            onChange={(e) => p.seek(Number(e.target.value))}
            className="flex-1 progress"
            style={{ ['--progress' as string]: `${p.duration ? (p.currentTime / p.duration) * 100 : 0}%` }}
            aria-label="Posisi lagu"
          />
          <span className="w-9">{fmtDuration(p.duration * 1000)}</span>
        </div>

        {/* Tombol transport utama */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => p.playPrev()}
            aria-label="Sebelumnya"
            className="text-muted hover:text-foreground p-2 transition-colors cursor-pointer active:scale-90"
          >
            <Ico name="prev" size={28} />
          </button>

          <button
            onClick={p.toggle}
            aria-label={p.isPlaying ? 'Jeda' : 'Putar'}
            className="rounded-full bg-accent text-on-accent p-4 hover:bg-accent-hover hover:scale-105 active:scale-90 transition-all cursor-pointer shadow-lg shadow-accent/30"
          >
            <Ico name={p.isPlaying ? 'pause' : 'play'} size={28} />
          </button>

          <button
            onClick={() => p.playNext()}
            aria-label="Berikutnya"
            className="text-muted hover:text-foreground p-2 transition-colors cursor-pointer active:scale-90"
          >
            <Ico name="next" size={28} />
          </button>
        </div>

        {/* Volume (Desktop saja — simetris di tengah) */}
        <div className="hidden md:flex items-center justify-center gap-2 text-muted max-w-[180px] mx-auto pt-1">
          <button
            onClick={p.toggleMute}
            aria-label={p.muted ? 'Nyalakan suara' : 'Bisukan'}
            className="p-1 hover:text-foreground transition-colors cursor-pointer shrink-0 active:scale-90"
          >
            <Ico name={p.muted ? 'mute' : 'volume'} size={18} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="w-full"
            aria-label="Volume"
          />
        </div>

        {/* Teks informasi bawah: Info Audio tampil di Mobile & Desktop, Petunjuk Shortcut khusus Desktop */}
        <div className="text-xs text-center select-none pt-1 space-y-0.5">
          {qualityStr && (
            <p className="text-xs text-muted/70 font-medium tracking-wide tabular-nums">
              {qualityStr}
            </p>
          )}
          <p className="hidden md:block text-[11px] text-muted/40">
            Spasi: putar/jeda · M: bisu · Esc: tutup
          </p>
        </div>
      </div>

      {/* ── Toast lokal ── */}
      {localToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-surface-hover border border-border text-sm text-foreground shadow-lg animate-fade-in"
        >
          {localToast}
        </div>
      )}

      {/* ── Playlist picker modal ── */}
      {showPlaylist && (
        <PlaylistPickerModal
          songId={c.id}
          onClose={() => setShowPlaylist(false)}
          onToast={showToast}
        />
      )}
    </div>
  );
}