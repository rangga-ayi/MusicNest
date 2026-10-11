import fs from 'fs';
import path from 'path';
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { pool, MUSIC_DIR, DATA_DIR } from './db';
import { parseMetadata, folderParts, resolveArtist, resolveAlbum, resolveTitle } from './metadata';
import { saveArtwork, findFolderArtwork, findArtistThumbnail } from './artwork';
import { playablePathFor, isAlacCodec, transcodeSong } from './transcode';

const AUDIO_EXT = new Set(['.mp3', '.flac', '.m4a', '.m4b', '.m4p', '.aac', '.ogg', '.opus', '.wav', '.wma']);

export interface ScanResult {
  files: number; newSongs: number; updated: number; removed: number;
  artists: number; albums: number; songs: number;
}

export class ScanLockError extends Error {
  constructor(message = 'Proses pemindaian sedang berjalan. Harap tunggu hingga selesai.') {
    super(message);
    this.name = 'ScanLockError';
  }
}

const LOCK_FILE = path.join(DATA_DIR, '.scan.lock');
let inMemoryScanActive = false;

/** Cek apakah pemindaian sedang berlangsung. */
export function isScanLocked(): boolean {
  if (inMemoryScanActive) return true;
  if (!fs.existsSync(LOCK_FILE)) return false;
  try {
    const stat = fs.statSync(LOCK_FILE);
    // Jika lock lebih dari 30 menit, anggap proses sebelumnya mati mendadak (stale)
    if (Date.now() - stat.mtimeMs > 30 * 60 * 1000) {
      try { fs.unlinkSync(LOCK_FILE); } catch {}
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Pasang lock sebelum scan berjalan. */
export function acquireScanLock(): void {
  if (inMemoryScanActive || isScanLocked()) {
    throw new ScanLockError();
  }
  inMemoryScanActive = true;
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, time: Date.now() }), { flag: 'w' });
  } catch (err) {
    inMemoryScanActive = false;
    throw err;
  }
}

/** Lepas lock setelah scan selesai atau gagal. */
export function releaseScanLock(): void {
  inMemoryScanActive = false;
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch {}
}

/** Rekursif kumpulkan file audio di MUSIC_DIR. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

async function getOrCreateArtist(conn: PoolConnection, name: string): Promise<number> {
  const [a] = await conn.query<ResultSetHeader>('INSERT IGNORE INTO artists (name) VALUES (?)', [name]);
  if (a.affectedRows === 1) return Number(a.insertId);
  const [rows] = await conn.query<any[]>('SELECT id FROM artists WHERE name = ?', [name]);
  return rows[0].id;
}

async function getOrCreateAlbum(conn: PoolConnection, artistId: number, name: string, year: number | null, artwork: string | null): Promise<number> {
  const [al] = await conn.query<ResultSetHeader>(
    'INSERT IGNORE INTO albums (artist_id, name, year, artwork) VALUES (?, ?, ?, ?)',
    [artistId, name, year, artwork]
  );
  if (al.affectedRows === 1) return Number(al.insertId);
  const [rows] = await conn.query<any[]>('SELECT id, artwork FROM albums WHERE artist_id = ? AND name = ?', [artistId, name]);
  if (artwork && rows[0].artwork === null) {
    await conn.query('UPDATE albums SET artwork = ? WHERE id = ?', [artwork, rows[0].id]);
  }
  return rows[0].id;
}

/** Resolve artwork: tag > folder.jpg/cover.jpg > thumbnail_Artist.* > null. */
async function resolveArtwork(file: string, parsed: { picture?: { data: Buffer; format: string } }, folders: string[]): Promise<string | null> {
  if (parsed.picture) {
    try { return saveArtwork(parsed.picture.data, parsed.picture.format); } catch { /* skip */ }
  }
  const dir = path.dirname(file);
  const folderArt = findFolderArtwork(dir);
  if (folderArt) return saveArtwork(fs.readFileSync(folderArt), extMime(folderArt));
  if (folders.length >= 2) {
    const artistDir = path.join(MUSIC_DIR, folders[folders.length - 2]);
    const thumb = findArtistThumbnail(artistDir);
    if (thumb) return saveArtwork(fs.readFileSync(thumb), extMime(thumb));
  }
  return null;
}

function extMime(p: string): string {
  const ext = path.extname(p).toLowerCase();
  return ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
}

export async function scanLibrary(): Promise<ScanResult> {
  acquireScanLock();

  const files = walk(MUSIC_DIR);
  const onDisk = new Set(files.map(f => path.resolve(f)));
  const stats = { files: 0, newSongs: 0, updated: 0, removed: 0 };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const file of files) {
      const stat = fs.statSync(file);
      if (stat.size === 0) continue; // placeholder kosong, skip
      const mtime = Math.round(stat.mtimeMs); // BIGINT di DB — bulatkan agar rescan idempotent
      stats.files++;

      const parsed = await parseMetadata(file);
      const folders = folderParts(file);
      const title = resolveTitle(parsed, file);
      const artistId = await getOrCreateArtist(conn, resolveArtist(parsed, folders));
      const artwork = await resolveArtwork(file, parsed, folders);
      const albumId = await getOrCreateAlbum(conn, artistId, resolveAlbum(parsed, folders), parsed.year, artwork);

      const format = path.extname(file).slice(1).toLowerCase();
      const [s] = await conn.query<ResultSetHeader>(
        `INSERT IGNORE INTO songs (album_id, title, track_no, disc_no, duration_ms, filepath, format, bitrate, sample_rate, size, mtime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [albumId, title, parsed.trackNo, parsed.discNo, parsed.durationMs, file, format, parsed.bitrate, parsed.sampleRate, stat.size, mtime]
      );
      let songId: number;
      if (s.affectedRows === 1) {
        songId = Number(s.insertId);
        stats.newSongs++;
      } else {
        const [rows] = await conn.query<any[]>('SELECT id, mtime, size FROM songs WHERE filepath = ?', [file]);
        songId = rows[0].id;
        if (rows[0] && (rows[0].mtime !== mtime || rows[0].size !== stat.size)) {
          await conn.query(
            `UPDATE songs SET album_id=?, title=?, track_no=?, disc_no=?, duration_ms=?, format=?, bitrate=?, sample_rate=?, size=?, mtime=?
             WHERE filepath = ?`,
            [albumId, title, parsed.trackNo, parsed.discNo, parsed.durationMs, format, parsed.bitrate, parsed.sampleRate, stat.size, mtime, file]
          );
          stats.updated++;
        }
      }

      // Pre-transcode ALAC → AAC saat scan, biar playback instan (cache di data/transcodes/)
      if (['m4a', 'm4b', 'm4p'].includes(format) && isAlacCodec(format, parsed.codec, file)) {
        transcodeSong(songId, file);
      }

      // LRC: cari file .lrc se-nama di folder sama (satu per lagu)
      const lrcPath = file.slice(0, -path.extname(file).length) + '.lrc';
      if (fs.existsSync(lrcPath)) {
        await conn.query(
          `INSERT INTO lyrics (song_id, filename)
           SELECT s.id, ? FROM songs s
           WHERE s.filepath = ? AND NOT EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id)`,
          [lrcPath, file]
        );
      }
    }

    // hapus lagu yang filenya sudah tidak ada (hanya yang di bawah MUSIC_DIR)
    const prefix = MUSIC_DIR.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const [existing] = await conn.query<any[]>(`SELECT id, filepath FROM songs WHERE filepath LIKE ?`, [`${prefix}%`]);
    for (const row of existing) {
      if (!onDisk.has(path.resolve(row.filepath))) {
        await conn.query('DELETE FROM songs WHERE id = ?', [row.id]);
        stats.removed++;
      }
    }

    await conn.query(
      `INSERT INTO settings (key_, value_) VALUES ('last_scan_at', ?) ON DUPLICATE KEY UPDATE value_ = VALUES(value_)`,
      [new Date().toISOString()]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
    releaseScanLock();
  }

  const [artistRows] = await pool.query<any[]>('SELECT COUNT(*) AS c FROM artists');
  const [albumRows] = await pool.query<any[]>('SELECT COUNT(*) AS c FROM albums');
  const [songRows] = await pool.query<any[]>('SELECT COUNT(*) AS c FROM songs');
  return {
    ...stats, artists: artistRows[0].c, albums: albumRows[0].c, songs: songRows[0].c,
  };
}
// ponytail: per-file sequential upsert dalam 1 transaksi. Untuk ribuan file makin lambat; paralel per-batch jika perlu.
