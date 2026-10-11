'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MediaCard from './MediaCard';
import PlayableSearchRow from './PlayableSearchRow';
import { usePlayer } from './PlayerProvider';
import { Song } from '@/lib/types';

interface SearchResultsViewProps {
  term: string;
  artists: Array<{ id: number; name: string; artwork?: string | null }>;
  albums: Array<{ id: number; name: string; artwork: string | null; artist: string; year: number | null }>;
  songs: Array<{
    id: number;
    title: string;
    duration_ms: number | null;
    album: string;
    artist: string;
    artwork?: string | null;
    format?: string | null;
    bitrate?: number | null;
    sample_rate?: number | null;
  }>;
  topResult: { type: 'artist' | 'album' | 'song'; item: any } | null;
}

export default function SearchResultsView({
  term,
  artists,
  albums,
  songs,
  topResult,
}: SearchResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const player = usePlayer();

  const totalResults = artists.length + albums.length + songs.length;
  const isEmpty = totalResults === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-2xl bg-surface-hover flex items-center justify-center text-muted mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Tidak ada hasil untuk &ldquo;{term}&rdquo;</h2>
        <p className="text-muted text-sm mt-2 max-w-sm">
          Periksa ejaan kata kunci atau coba gunakan nama artis, judul album, atau lirik lagu lainnya.
        </p>
      </div>
    );
  }

  // Convert song list to Song[] for player queue
  const songListForQueue: Song[] = songs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    artwork: s.artwork ?? null,
    duration_ms: s.duration_ms,
    format: s.format,
    bitrate: s.bitrate,
    sample_rate: s.sample_rate,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Filter Pills */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hasil Pencarian &ldquo;{term}&rdquo;</h1>
            <p className="text-sm text-muted mt-1">{totalResults} hasil ditemukan</p>
          </div>

          {songs.length > 0 && (
            <button
              onClick={() => player.setQueueAndPlay(songListForQueue, 0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-on-accent text-sm font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Putar Semua Hasil
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Semua', count: totalResults },
            { id: 'songs', label: 'Lagu', count: songs.length },
            { id: 'artists', label: 'Artis', count: artists.length },
            { id: 'albums', label: 'Album', count: albums.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-foreground text-background shadow'
                  : 'bg-surface hover:bg-surface-hover text-muted hover:text-foreground'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* TAB: SEMUA (ALL) */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* Top Result + Songs Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Result / Hasil Utama */}
            {topResult && (
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold mb-3">Hasil Utama</h2>
                <div className="group relative bg-surface hover:bg-surface-hover/80 p-5 rounded-2xl border border-border/50 transition-all duration-200 shadow-sm">
                  {topResult.type === 'artist' && (
                    <div className="flex flex-col items-start gap-4">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-accent/20 text-accent flex items-center justify-center text-3xl font-bold shadow-md relative">
                        {topResult.item.artwork ? (
                          <Image
                            src={`/api/artwork/${topResult.item.artwork}`}
                            alt={topResult.item.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          topResult.item.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent/15 text-accent mb-2">
                          ARTIS
                        </span>
                        <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                          {topResult.item.name}
                        </h3>
                      </div>
                      <Link
                        href={`/artists/${topResult.item.id}`}
                        className="mt-2 text-xs font-semibold text-muted group-hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        Lihat profil artis
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}

                  {topResult.type === 'album' && (
                    <div className="flex flex-col items-start gap-4">
                      <div className="h-24 w-24 rounded-xl overflow-hidden bg-surface-hover shadow-md relative">
                        {topResult.item.artwork ? (
                          <Image
                            src={`/api/artwork/${topResult.item.artwork}`}
                            alt={topResult.item.name}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent/15 text-accent mb-2">
                          ALBUM
                        </span>
                        <h3 className="text-2xl font-bold text-foreground line-clamp-1">
                          {topResult.item.name}
                        </h3>
                        <p className="text-sm text-muted mt-1">{topResult.item.artist}</p>
                      </div>
                      <Link
                        href={`/albums/${topResult.item.id}`}
                        className="mt-2 text-xs font-semibold text-muted group-hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        Lihat detail album
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}

                  {topResult.type === 'song' && (
                    <div className="flex flex-col items-start gap-4">
                      <div className="h-24 w-24 rounded-xl overflow-hidden bg-surface-hover shadow-md relative">
                        {topResult.item.artwork ? (
                          <Image
                            src={`/api/artwork/${topResult.item.artwork}`}
                            alt={topResult.item.title}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent/15 text-accent mb-2">
                          LAGU
                        </span>
                        <h3 className="text-2xl font-bold text-foreground line-clamp-1">
                          {topResult.item.title}
                        </h3>
                        <p className="text-sm text-muted mt-1">{topResult.item.artist} · {topResult.item.album}</p>
                      </div>
                      <button
                        onClick={() => player.playSong({
                          id: topResult.item.id,
                          title: topResult.item.title,
                          artist: topResult.item.artist,
                          album: topResult.item.album,
                          artwork: topResult.item.artwork ?? null,
                          duration_ms: topResult.item.duration_ms,
                        })}
                        className="absolute bottom-5 right-5 h-12 w-12 rounded-full bg-accent text-on-accent flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
                        aria-label={`Putar ${topResult.item.title}`}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Songs Preview */}
            <div className={topResult ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Lagu</h2>
                {songs.length > 4 && (
                  <button
                    onClick={() => setActiveTab('songs')}
                    className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Lihat semua ({songs.length})
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {songs.slice(0, 4).map((s) => (
                  <PlayableSearchRow key={s.id} s={s} />
                ))}
              </div>
            </div>
          </div>

          {/* Artists Section */}
          {artists.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Artis</h2>
                {artists.length > 6 && (
                  <button
                    onClick={() => setActiveTab('artists')}
                    className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Lihat semua ({artists.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {artists.slice(0, 6).map((a) => (
                  <Link
                    key={a.id}
                    href={`/artists/${a.id}`}
                    className="flex flex-col items-center p-4 rounded-xl bg-surface hover:bg-surface-hover transition-all text-center group"
                  >
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-accent/15 text-accent flex items-center justify-center text-2xl font-bold mb-3 group-hover:scale-105 transition-transform shadow-sm relative">
                      {a.artwork ? (
                        <Image
                          src={`/api/artwork/${a.artwork}`}
                          alt={a.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        a.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-semibold text-sm truncate w-full group-hover:text-accent transition-colors">
                      {a.name}
                    </span>
                    <span className="text-xs text-muted mt-0.5">Artis</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Albums Section */}
          {albums.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Album</h2>
                {albums.length > 5 && (
                  <button
                    onClick={() => setActiveTab('albums')}
                    className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    Lihat semua ({albums.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {albums.slice(0, 5).map((al) => (
                  <MediaCard
                    key={al.id}
                    href={`/albums/${al.id}`}
                    artwork={al.artwork}
                    title={al.name}
                    subtitle={al.artist}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* TAB: SONGS ONLY */}
      {activeTab === 'songs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Semua Lagu Ditemukan ({songs.length})</h2>
          </div>
          {songs.length === 0 ? (
            <p className="text-muted text-sm py-8">Tidak ada lagu yang cocok.</p>
          ) : (
            <div className="space-y-1">
              {songs.map((s) => (
                <PlayableSearchRow key={s.id} s={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ARTISTS ONLY */}
      {activeTab === 'artists' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Semua Artis Ditemukan ({artists.length})</h2>
          {artists.length === 0 ? (
            <p className="text-muted text-sm py-8">Tidak ada artis yang cocok.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/artists/${a.id}`}
                  className="flex flex-col items-center p-4 rounded-xl bg-surface hover:bg-surface-hover transition-all text-center group"
                >
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-accent/15 text-accent flex items-center justify-center text-3xl font-bold mb-3 group-hover:scale-105 transition-transform shadow-md relative">
                    {a.artwork ? (
                      <Image
                        src={`/api/artwork/${a.artwork}`}
                        alt={a.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      a.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-sm truncate w-full group-hover:text-accent transition-colors">
                    {a.name}
                  </span>
                  <span className="text-xs text-muted mt-0.5">Artis</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ALBUMS ONLY */}
      {activeTab === 'albums' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Semua Album Ditemukan ({albums.length})</h2>
          {albums.length === 0 ? (
            <p className="text-muted text-sm py-8">Tidak ada album yang cocok.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((al) => (
                <MediaCard
                  key={al.id}
                  href={`/albums/${al.id}`}
                  artwork={al.artwork}
                  title={al.name}
                  subtitle={al.artist}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
