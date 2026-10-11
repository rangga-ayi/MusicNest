export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
  duration_ms: number | null;
  track_no?: number | null;
  format?: string | null;
  bitrate?: number | null;
  sample_rate?: number | null;
}

/** Detail metadata lagu untuk Slide 3 FullPlayer. */
export interface SongMeta {
  id: number;
  title: string;
  artist: string;
  album: string;
  year: number | null;
  format: string | null;
  bitrate: number | null;
  sample_rate: number | null;
  size: number | null;
  duration_ms: number | null;
}
