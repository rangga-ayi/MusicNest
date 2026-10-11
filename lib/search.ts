import { pool } from './db';

export interface RawArtistResult {
  id: number;
  name: string;
  artwork: string | null;
}

export interface RawAlbumResult {
  id: number;
  name: string;
  artwork: string | null;
  artist: string;
  year: number | null;
}

export interface RawSongResult {
  id: number;
  title: string;
  duration_ms: number | null;
  track_no: number | null;
  album: string;
  artwork: string | null;
  artist: string;
  format?: string | null;
  bitrate?: number | null;
  sample_rate?: number | null;
}

export interface SearchData {
  artists: RawArtistResult[];
  albums: RawAlbumResult[];
  songs: RawSongResult[];
  topResult: { type: 'artist' | 'album' | 'song'; item: any } | null;
}

/**
 * Sanitasi dan format query untuk MySQL FULLTEXT search dalam BOOLEAN MODE.
 * Menghapus operator khusus MySQL boolean mode (+, -, >, <, (), ~, *, ", @)
 * agar query dengan karakter khusus tidak menyebabkan error sintaks SQL.
 */
function prepareFtsTerm(query: string): string {
  const clean = query.replace(/[+\-><()~*\"@~]/g, ' ').trim();
  if (!clean) return '';
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `+${t}*`)
    .join(' ');
}

/**
 * Eksekusi pencarian 2-stage (Terbaik & Cepat):
 * 1. Multi-kolom MySQL FULLTEXT Search (`MATCH(...) AGAINST(... IN BOOLEAN MODE)`) dengan pembobotan skor relevansi
 * 2. Fallback pintar ke `LIKE '%query%'` jika FTS miss atau kata kunci < 3 karakter
 */
export async function executeSearch(query: string, limit: number = 30): Promise<SearchData> {
  const q = query.trim();
  if (!q) {
    return { artists: [], albums: [], songs: [], topResult: null };
  }

  const exactPattern = q.toLowerCase();
  const startsWithPattern = `${q}%`;
  const containsPattern = `%${q}%`;

  const ftsTerm = prepareFtsTerm(q);
  const canUseFts = q.length >= 3 && ftsTerm.length > 0;

  // 1. SEARCH ARTISTS
  let artists: RawArtistResult[] = [];
  if (canUseFts) {
    try {
      const [ftsArtists] = await pool.query<any[]>(
        `SELECT a.id, a.name,
           COALESCE(a.avatar, (SELECT artwork FROM albums WHERE artist_id = a.id AND artwork IS NOT NULL LIMIT 1)) AS artwork,
           (MATCH(a.name) AGAINST(? IN BOOLEAN MODE) * 3 +
            CASE WHEN LOWER(a.name) = ? THEN 10 WHEN a.name LIKE ? THEN 5 ELSE 0 END) AS score
         FROM artists a
         WHERE MATCH(a.name) AGAINST(? IN BOOLEAN MODE)
         ORDER BY score DESC, a.name ASC
         LIMIT ${limit}`,
        [ftsTerm, exactPattern, startsWithPattern, ftsTerm]
      );
      artists = ftsArtists;
    } catch {
      artists = [];
    }
  }

  // Fallback LIKE untuk Artists jika FTS miss
  if (artists.length === 0) {
    const [likeArtists] = await pool.query<any[]>(
      `SELECT a.id, a.name,
         COALESCE(a.avatar, (SELECT artwork FROM albums WHERE artist_id = a.id AND artwork IS NOT NULL LIMIT 1)) AS artwork,
         CASE 
           WHEN LOWER(a.name) = ? THEN 1
           WHEN a.name LIKE ? THEN 2
           ELSE 3
         END AS relevance
       FROM artists a
       WHERE a.name LIKE ?
       ORDER BY relevance ASC, a.name ASC
       LIMIT ${limit}`,
      [exactPattern, startsWithPattern, containsPattern]
    );
    artists = likeArtists;
  }

  // 2. SEARCH ALBUMS (Mencari di judul album dan nama artis)
  let albums: RawAlbumResult[] = [];
  if (canUseFts) {
    try {
      const [ftsAlbums] = await pool.query<any[]>(
        `SELECT al.id, al.name, al.artwork, al.year, a.name AS artist,
           (MATCH(al.name) AGAINST(? IN BOOLEAN MODE) * 3 +
            MATCH(a.name) AGAINST(? IN BOOLEAN MODE) * 2 +
            CASE WHEN LOWER(al.name) = ? THEN 10 WHEN al.name LIKE ? THEN 5 ELSE 0 END) AS score
         FROM albums al
         JOIN artists a ON al.artist_id = a.id
         WHERE MATCH(al.name) AGAINST(? IN BOOLEAN MODE)
            OR MATCH(a.name) AGAINST(? IN BOOLEAN MODE)
         ORDER BY score DESC, al.name ASC
         LIMIT ${limit}`,
        [ftsTerm, ftsTerm, exactPattern, startsWithPattern, ftsTerm, ftsTerm]
      );
      albums = ftsAlbums;
    } catch {
      albums = [];
    }
  }

  // Fallback LIKE untuk Albums
  if (albums.length === 0) {
    const [likeAlbums] = await pool.query<any[]>(
      `SELECT al.id, al.name, al.artwork, al.year, a.name AS artist,
         CASE 
           WHEN LOWER(al.name) = ? THEN 1
           WHEN al.name LIKE ? THEN 2
           WHEN LOWER(a.name) = ? THEN 3
           ELSE 4
         END AS relevance
       FROM albums al
       JOIN artists a ON al.artist_id = a.id
       WHERE al.name LIKE ? OR a.name LIKE ?
       ORDER BY relevance ASC, al.name ASC
       LIMIT ${limit}`,
      [exactPattern, startsWithPattern, exactPattern, containsPattern, containsPattern]
    );
    albums = likeAlbums;
  }

  // 3. SEARCH SONGS (Mencari di judul lagu, nama artis, dan nama album)
  let songs: RawSongResult[] = [];
  if (canUseFts) {
    try {
      const [ftsSongs] = await pool.query<any[]>(
        `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
                al.name AS album, al.artwork, ar.name AS artist,
           (MATCH(s.title) AGAINST(? IN BOOLEAN MODE) * 4 +
            MATCH(ar.name) AGAINST(? IN BOOLEAN MODE) * 2 +
            MATCH(al.name) AGAINST(? IN BOOLEAN MODE) * 1 +
            CASE WHEN LOWER(s.title) = ? THEN 10 WHEN s.title LIKE ? THEN 5 ELSE 0 END) AS score
         FROM songs s
         JOIN albums al ON s.album_id = al.id
         JOIN artists ar ON al.artist_id = ar.id
         WHERE MATCH(s.title) AGAINST(? IN BOOLEAN MODE)
            OR MATCH(ar.name) AGAINST(? IN BOOLEAN MODE)
            OR MATCH(al.name) AGAINST(? IN BOOLEAN MODE)
         ORDER BY score DESC, s.title ASC
         LIMIT ${limit}`,
        [ftsTerm, ftsTerm, ftsTerm, exactPattern, startsWithPattern, ftsTerm, ftsTerm, ftsTerm]
      );
      songs = ftsSongs;
    } catch {
      songs = [];
    }
  }

  // Fallback LIKE untuk Songs
  if (songs.length === 0) {
    const [likeSongs] = await pool.query<any[]>(
      `SELECT s.id, s.title, s.duration_ms, s.track_no, s.format, s.bitrate, s.sample_rate,
              al.name AS album, al.artwork, ar.name AS artist,
         CASE 
           WHEN LOWER(s.title) = ? THEN 1
           WHEN s.title LIKE ? THEN 2
           WHEN LOWER(ar.name) = ? THEN 3
           WHEN LOWER(al.name) = ? THEN 4
           ELSE 5
         END AS relevance
       FROM songs s
       JOIN albums al ON s.album_id = al.id
       JOIN artists ar ON al.artist_id = ar.id
       WHERE s.title LIKE ? OR ar.name LIKE ? OR al.name LIKE ?
       ORDER BY relevance ASC, s.title ASC
       LIMIT ${limit}`,
      [
        exactPattern,
        startsWithPattern,
        exactPattern,
        exactPattern,
        containsPattern,
        containsPattern,
        containsPattern,
      ]
    );
    songs = likeSongs;
  }

  // Tentukan Top Result secara presisi
  let topResult: { type: 'artist' | 'album' | 'song'; item: any } | null = null;
  if (artists.length > 0 && artists[0].name.toLowerCase() === exactPattern) {
    topResult = { type: 'artist', item: artists[0] };
  } else if (songs.length > 0 && songs[0].title.toLowerCase() === exactPattern) {
    topResult = { type: 'song', item: songs[0] };
  } else if (albums.length > 0 && albums[0].name.toLowerCase() === exactPattern) {
    topResult = { type: 'album', item: albums[0] };
  } else if (artists.length > 0) {
    topResult = { type: 'artist', item: artists[0] };
  } else if (songs.length > 0) {
    topResult = { type: 'song', item: songs[0] };
  } else if (albums.length > 0) {
    topResult = { type: 'album', item: albums[0] };
  }

  return { artists, albums, songs, topResult };
}

