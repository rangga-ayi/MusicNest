'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePlayer } from './PlayerProvider';
import { fmtDuration } from '@/lib/format';
import { Song } from '@/lib/types';
import MediaCard from './MediaCard';

interface ArtistSongItem {
  id: number;
  title: string;
  duration_ms: number | null;
  track_no: number | null;
  album_id: number;
  album_name: string;
  artwork: string | null;
  artist: string;
}

interface ArtistAlbumItem {
  id: number;
  name: string;
  year: number | null;
  artwork: string | null;
  track_count?: number;
}

interface ArtistPageClientProps {
  artist: { id: number; name: string; avatar?: string | null; bio?: string | null };
  albums: ArtistAlbumItem[];
  songs: ArtistSongItem[];
}

export default function ArtistPageClient({ artist, albums, songs }: ArtistPageClientProps) {
  const player = usePlayer();
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [albumFilter, setAlbumFilter] = useState<'all' | 'albums' | 'singles'>('all');

  // Convert artist songs to queue-compatible Song type
  const artistQueue: Song[] = songs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album_name,
    artwork: s.artwork,
    duration_ms: s.duration_ms,
  }));

  // Avatar Image prioritizes artist.avatar from Deezer API, falls back to album cover
  const avatarImage = artist.avatar || albums.find((a) => a.artwork)?.artwork || null;
  const heroBackdrop = albums.find((a) => a.artwork)?.artwork || avatarImage;

  // Filter Albums & Singles (albums with 1-3 tracks treated as Single & EP)
  const singles = albums.filter((a) => (a.track_count ?? 5) <= 3);
  const fullAlbums = albums.filter((a) => (a.track_count ?? 5) > 3);

  const displayedAlbums =
    albumFilter === 'albums'
      ? fullAlbums
      : albumFilter === 'singles'
      ? singles
      : albums;

  const displayedSongs = showAllSongs ? songs : songs.slice(0, 5);

  const handlePlayAll = () => {
    if (artistQueue.length > 0) {
      player.setQueueAndPlay(artistQueue, 0);
    }
  };

  const handleShufflePlay = () => {
    if (artistQueue.length > 0) {
      const randomIndex = Math.floor(Math.random() * artistQueue.length);
      if (!player.shuffle) {
        player.toggleShuffle();
      }
      player.setQueueAndPlay(artistQueue, randomIndex);
    }
  };

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 pb-12 space-y-8">
      {/* YOUTUBE MUSIC HERO BANNER & HEADER */}
      <div className="relative overflow-hidden bg-surface border-b border-border/40 min-h-[320px] md:min-h-[380px] flex flex-col justify-end p-6 md:p-10">
        {/* Backdrop Blurred Cover Image */}
        {heroBackdrop && (
          <div className="absolute inset-0 z-0">
            <Image
              src={`/api/artwork/${heroBackdrop}`}
              alt={artist.name}
              fill
              priority
              className="object-cover opacity-25 blur-3xl scale-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
          {/* Circular Avatar */}
          <div className="relative h-36 w-36 sm:h-44 sm:w-44 md:h-48 md:w-48 rounded-full overflow-hidden shrink-0 shadow-2xl ring-4 ring-white/10 bg-surface-hover flex items-center justify-center text-accent">
            {avatarImage ? (
              <Image
                src={`/api/artwork/${avatarImage}`}
                alt={artist.name}
                width={200}
                height={200}
                priority
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-5xl font-black">{artist.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Artist Metadata & Action Pills */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
                Artis MusicNest
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-foreground">
                {artist.name}
              </h1>
              <p className="text-sm md:text-base text-muted mt-2 font-medium">
                {albums.length} Album &bull; {songs.length} Lagu di Library
              </p>
            </div>

            {/* Action Buttons (YouTube Music style pill buttons) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-accent text-on-accent font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Putar
              </button>

              <button
                onClick={handleShufflePlay}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-surface-hover hover:bg-surface border border-border text-foreground font-semibold text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
                Acak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTIONS (INSET PADDING) */}
      <div className="px-4 md:px-6 space-y-10">
        {/* SEKSI: LAGU TERPOPULER */}
        {songs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Lagu Terpopuler</h2>
                <p className="text-xs text-muted mt-0.5">Trek yang sering diputar dari {artist.name}</p>
              </div>

              {songs.length > 5 && (
                <button
                  onClick={() => setShowAllSongs(!showAllSongs)}
                  className="text-xs font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  {showAllSongs ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${songs.length})`}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${showAllSongs ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-1 bg-surface/40 p-2 rounded-2xl border border-border/40">
              {displayedSongs.map((s, idx) => {
                const isCurrentPlaying = player.current?.id === s.id && player.isPlaying;

                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      player.playSong({
                        id: s.id,
                        title: s.title,
                        artist: s.artist,
                        album: s.album_name,
                        artwork: s.artwork,
                        duration_ms: s.duration_ms,
                      })
                    }
                    className="group w-full flex items-center gap-3 md:gap-4 p-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left cursor-pointer"
                  >
                    {/* Index Number / Play Icon / Equalizer */}
                    <span className="w-6 text-center text-xs font-semibold text-muted group-hover:hidden">
                      {isCurrentPlaying ? (
                        <span className="inline-flex items-end gap-[2px] h-3.5 mx-auto" aria-hidden="true">
                          <span className="eq-bar w-[2.5px] h-3.5 bg-accent rounded-sm" style={{ animationDelay: '0ms' }} />
                          <span className="eq-bar w-[2.5px] h-3.5 bg-accent rounded-sm" style={{ animationDelay: '150ms' }} />
                          <span className="eq-bar w-[2.5px] h-3.5 bg-accent rounded-sm" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="w-6 text-center text-accent hidden group-hover:inline-block">
                      {isCurrentPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </span>

                    {/* Song Artwork Thumbnail */}
                    <div className="h-11 w-11 rounded-lg bg-surface-hover overflow-hidden shrink-0 relative flex items-center justify-center text-muted border border-white/[0.06]">
                      {s.artwork ? (
                        <Image
                          src={`/api/artwork/${s.artwork}`}
                          alt={s.title}
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                        </svg>
                      )}
                    </div>

                    {/* Title & Album */}
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-medium ${isCurrentPlaying ? 'text-accent font-bold' : 'text-foreground'}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted truncate mt-0.5">
                        <Link
                          href={`/albums/${s.album_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline hover:text-foreground"
                        >
                          {s.album_name}
                        </Link>
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="text-xs text-muted font-mono tabular-nums shrink-0">{fmtDuration(s.duration_ms)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* SEKSI: DISKOGRAFI (ALBUM & SINGLES) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Diskografi</h2>
              <p className="text-xs text-muted mt-0.5">Album dan single rilis dari {artist.name}</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Semua Rilis', count: albums.length },
                { id: 'albums', label: 'Album', count: fullAlbums.length },
                { id: 'singles', label: 'Single & EP', count: singles.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAlbumFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    albumFilter === tab.id
                      ? 'bg-foreground text-background shadow'
                      : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {displayedAlbums.length === 0 ? (
            <p className="text-muted text-sm py-8 text-center">Tidak ada rilis dalam kategori ini.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedAlbums.map((al) => (
                <MediaCard
                  key={al.id}
                  href={`/albums/${al.id}`}
                  artwork={al.artwork}
                  title={al.name}
                  subtitle={al.year ? `${al.year} &bull; Album` : 'Album'}
                />
              ))}
            </div>
          )}
        </section>

        {/* SEKSI: TENTANG ARTIS (DENGAN BIOGRAFI WIKIPEDIA) */}
        <section className="space-y-4 pt-4 border-t border-border/40">
          <h2 className="text-xl font-bold tracking-tight">Tentang Artis</h2>
          <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-3 max-w-2xl">
              <h3 className="text-lg font-bold">{artist.name}</h3>

              {/* Biografi Wikipedia */}
              {artist.bio ? (
                <div className="space-y-2">
                  <p className={`text-sm text-muted leading-relaxed ${!showFullBio ? 'line-clamp-3' : ''}`}>
                    {artist.bio}
                  </p>
                  {artist.bio.length > 180 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      {showFullBio ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted leading-relaxed">
                  Artis ini memiliki total <span className="text-foreground font-semibold">{albums.length} album</span> dan{' '}
                  <span className="text-foreground font-semibold">{songs.length} lagu</span> yang tersedia di library koleksi MusicNest milik Anda.
                </p>
              )}
            </div>

            <div className="flex gap-4 sm:gap-6 text-center shrink-0">
              <div className="bg-surface p-4 rounded-xl border border-border/40 min-w-[100px]">
                <p className="text-2xl font-black text-accent">{albums.length}</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Album</p>
              </div>
              <div className="bg-surface p-4 rounded-xl border border-border/40 min-w-[100px]">
                <p className="text-2xl font-black text-foreground">{songs.length}</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Lagu</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
