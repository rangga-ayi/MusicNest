'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Song } from '@/lib/types';

const STORAGE_KEY = 'musicnest_last_playback';

interface SavedPlaybackState {
  song: Song;
  queue: Song[];
  index: number;
  time: number;
}

// simple toast — one message at a time
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, show: setToast };
}

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  current: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  playSong: (song: Song) => void;
  setQueueAndPlay: (songs: Song[], startIndex: number) => void;
  playNext: () => void;
  playPrev: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  shuffleAll: () => Promise<void>;
  cycleRepeat: () => void;
  toast: string | null;
}

const PlayerCtx = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Song[]>([]);
  const indexRef = useRef(0);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>('off');
  const lastSaveTimeRef = useRef(0);

  const [current, setCurrent] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const { toast, show: showToast } = useToast();

  const savePlaybackState = (song: Song | null, time: number) => {
    if (typeof window === 'undefined' || !song) return;
    try {
      const data: SavedPlaybackState = {
        song,
        queue: queueRef.current,
        index: indexRef.current,
        time: Math.floor(time),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };

  /** Pindah +delta lagu. stopAtEnd = jangan wrap (ujung queue = berhenti). */
  function step(delta: number, stopAtEnd = false) {
    const q = queueRef.current;
    if (!q.length) return;
    if (repeatRef.current === 'one' && delta !== 0) {
      // satu lagu: ulangi lagi
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    let ni: number;
    if (shuffleRef.current && q.length > 1) {
      let r;
      do { r = Math.floor(Math.random() * q.length); } while (r === indexRef.current);
      ni = r;
    } else {
      ni = indexRef.current + delta;
      if (ni >= q.length) {
        if (stopAtEnd) {
          if (repeatRef.current === 'all') { ni = 0; }
          else {
            audioRef.current?.pause();
            setIsPlaying(false);
            setCurrentTime(0);
            return;
          }
        } else ni = 0;
      }
      if (ni < 0) ni = q.length - 1;
    }
    indexRef.current = ni;
    const nextSong = q[ni];
    setCurrent(nextSong);
    const a = audioRef.current;
    if (a) {
      a.src = `/api/stream/${nextSong.id}`;
      a.play().catch(() => {});
      setIsPlaying(true);
    }
    savePlaybackState(nextSong, 0);
  }

  // inisialisasi audio sekali
  if (typeof window !== 'undefined' && !audioRef.current) {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = 1;
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (Math.abs(audio.currentTime - lastSaveTimeRef.current) >= 2) {
        lastSaveTimeRef.current = audio.currentTime;
        if (queueRef.current[indexRef.current]) {
          savePlaybackState(queueRef.current[indexRef.current], audio.currentTime);
        }
      }
    };
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.onended = () => step(1, true);
    audio.onerror = () => { showToast('Lagu gagal diputar, melewati...'); step(1); };
  }
  const audio = audioRef.current!;

  // Pulihkan posisi dan lagu terakhir dari localStorage saat pertama kali dimuat
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: SavedPlaybackState = JSON.parse(raw);
      if (saved && saved.song && saved.song.id) {
        queueRef.current = saved.queue?.length ? saved.queue : [saved.song];
        indexRef.current = typeof saved.index === 'number' ? saved.index : 0;
        setCurrent(saved.song);
        const restoreTime = saved.time || 0;
        setCurrentTime(restoreTime);
        if (audioRef.current) {
          audioRef.current.src = `/api/stream/${saved.song.id}`;
          audioRef.current.currentTime = restoreTime;
        }
      }
    } catch {}
  }, []);

  // Media Session API: Metadata info lagu
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artworkUrl = current.artwork
      ? (current.artwork.startsWith('http') ? current.artwork : `${window.location.origin}/api/artwork/${current.artwork}`)
      : `${window.location.origin}/icon.svg`;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: [
        { src: artworkUrl, sizes: '96x96', type: 'image/webp' },
        { src: artworkUrl, sizes: '128x128', type: 'image/webp' },
        { src: artworkUrl, sizes: '192x192', type: 'image/webp' },
        { src: artworkUrl, sizes: '256x256', type: 'image/webp' },
        { src: artworkUrl, sizes: '512x512', type: 'image/webp' },
      ],
    });
  }, [current]);

  // Media Session API: Status pemutaran (playing / paused)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Media Session API: Sinkronisasi posisi seek bar
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if ('setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audioRef.current?.playbackRate || 1,
          position: Math.min(currentTime, duration),
        });
      } catch {}
    }
  }, [currentTime, duration]);

  // Media Session API: Action handlers untuk tombol lockscreen/headset/notifikasi
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    };

    setAction('play', () => {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    });
    setAction('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    setAction('previoustrack', () => step(-1));
    setAction('nexttrack', () => step(1));
    setAction('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      setAction('play', null);
      setAction('pause', null);
      setAction('previoustrack', null);
      setAction('nexttrack', null);
      setAction('seekto', null);
    };
  }, []);

  const playSong = (song: Song) => {
    queueRef.current = [song];
    indexRef.current = 0;
    setCurrent(song);
    audio.src = `/api/stream/${song.id}`;
    audio.play().catch(() => {});
    setIsPlaying(true);
    savePlaybackState(song, 0);
  };

  const setQueueAndPlay = (songs: Song[], startIndex: number) => {
    queueRef.current = songs;
    indexRef.current = startIndex;
    setCurrent(songs[startIndex]);
    audio.src = `/api/stream/${songs[startIndex].id}`;
    audio.play().catch(() => {});
    setIsPlaying(true);
    savePlaybackState(songs[startIndex], 0);
  };

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seek = (t: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
    if (current) savePlaybackState(current, t);
  };

  const setVol = (v: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = v;
    setVolumeState(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.volume = volume || 0.7;
      setMuted(false);
    } else {
      audioRef.current.volume = 0;
      setMuted(true);
    }
  };

  const toggleShuffle = () => {
    shuffleRef.current = !shuffleRef.current;
    setShuffle(shuffleRef.current);
  };

  const shuffleAll = async () => {
    try {
      const res = await fetch('/api/songs/random');
      if (!res.ok) throw new Error('Gagal mengambil lagu acak');
      const songs: Song[] = await res.json();
      if (!songs.length) {
        showToast('Pustaka musik kosong.');
        return;
      }
      shuffleRef.current = true;
      setShuffle(true);
      setQueueAndPlay(songs, 0);
      showToast(`Memutar ${songs.length} lagu secara acak`);
    } catch {
      showToast('Gagal memuat lagu acak');
    }
  };

  const cycleRepeat = () => {
    const next: RepeatMode = repeatRef.current === 'off' ? 'all' : repeatRef.current === 'all' ? 'one' : 'off';
    repeatRef.current = next;
    setRepeat(next);
  };

  // keyboard shortcuts (Space play/pause, M mute)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 'm' || e.key === 'M') toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, toggleMute]);

  const value: PlayerState = {
    current, isPlaying, currentTime, duration, volume, muted, shuffle, repeat, toast,
    playSong, setQueueAndPlay, playNext: () => step(1), playPrev: () => step(-1),
    toggle, seek, setVolume: setVol, toggleMute, toggleShuffle, shuffleAll, cycleRepeat,
  };

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-surface-hover border border-border text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}
    </PlayerCtx.Provider>
  );
}
