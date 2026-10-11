import { existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import path from 'path';
import { execFileSync, execFile } from 'child_process';
import { DATA_DIR } from './db';

const TRANSCODE_DIR = path.join(DATA_DIR, 'transcodes');
mkdirSync(TRANSCODE_DIR, { recursive: true });

// aac_mf (MediaFoundation) jauh lebih cepat di Windows (≈5s vs ≈16s CPU). Deteksi sekali, cache module-level.
let AAC_ENC: 'aac_mf' | 'aac' | null = null;
function aacEncoder(): 'aac_mf' | 'aac' {
  if (AAC_ENC) return AAC_ENC;
  try {
    const out = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    AAC_ENC = out.includes('aac_mf') ? 'aac_mf' : 'aac';
  } catch {
    AAC_ENC = 'aac';
  }
  return AAC_ENC;
}

/** Path cache hasil transcode untuk song id. */
export function transcodePath(songId: number): string {
  return path.join(TRANSCODE_DIR, `${songId}.m4a`);
}

/** Deteksi nama codec audio dengan ffprobe (tanpa shell). */
export function probeCodec(filepath: string): string | null {
  try {
    return execFileSync(
      'ffprobe',
      [
        '-v', 'quiet',
        '-show_entries', 'stream=codec_name',
        '-select_streams', 'a:0',
        '-of', 'csv=p=0',
        filepath,
      ],
      {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
  } catch {
    return null;
  }
}

/** Cek apakah format & codec merupakan ALAC (Apple Lossless). */
export function isAlacCodec(format: string, codec?: string | null, filepath?: string): boolean {
  const fmt = format.toLowerCase();
  if (!['m4a', 'm4b', 'm4p'].includes(fmt)) return false;

  const c = codec?.toLowerCase() ?? '';
  if (c.includes('alac') || c.includes('apple lossless')) return true;

  if (!codec && filepath) {
    const probed = probeCodec(filepath)?.toLowerCase() ?? '';
    return probed.includes('alac') || probed.includes('apple lossless');
  }

  return false;
}

/** Cek apakah file transcode yang valid sudah tersedia di disk. */
export function isTranscodeReady(songId: number, filepath: string): boolean {
  const cache = transcodePath(songId);
  try {
    return existsSync(cache) && statSync(cache).mtimeMs >= statSync(filepath).mtimeMs;
  } catch {
    return false;
  }
}

/** Transcode file audio ALAC ke AAC 256k secara sinkron (dijalankan saat scan). */
export function transcodeSong(songId: number, filepath: string): boolean {
  if (isTranscodeReady(songId, filepath)) return true;
  const cache = transcodePath(songId);
  try {
    execFileSync(
      'ffmpeg',
      [
        '-v', 'error',
        '-i', filepath,
        '-vn',
        '-c:a', aacEncoder(),
        '-b:a', '256k',
        '-movflags', '+faststart',
        '-y', cache,
      ],
      {
        timeout: 300000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return true;
  } catch {
    if (existsSync(cache)) {
      try { unlinkSync(cache); } catch {}
    }
    return false;
  }
}

// Lacak pekerjaan transcode background yang sedang berjalan
const inFlightBackground = new Set<number>();

/** Picu transcode background non-blocking jika cache belum ada saat request stream masuk. */
export function triggerBackgroundTranscode(songId: number, filepath: string): void {
  if (inFlightBackground.has(songId)) return;
  inFlightBackground.add(songId);

  const cache = transcodePath(songId);
  const args = [
    '-v', 'error',
    '-i', filepath,
    '-vn',
    '-c:a', aacEncoder(),
    '-b:a', '256k',
    '-movflags', '+faststart',
    '-y', cache,
  ];

  execFile('ffmpeg', args, { windowsHide: true }, (err) => {
    inFlightBackground.delete(songId);
    if (err && existsSync(cache)) {
      try { unlinkSync(cache); } catch {}
    }
  });
}

export interface PlayablePathResult {
  path: string;
  ready: boolean;
}

/**
 * Tentukan path stream audio secara non-blocking.
 * - Format selain m4a/m4b/m4p: langsung siap (ready: true) dari file asli.
 * - Format m4a ALAC dengan cache: langsung siap (ready: true) dari transcode cache.
 * - Format m4a ALAC tanpa cache: memicu transcode background dan mengembalikan ready: false (tidak memblokir HTTP).
 */
export function getPlayablePath(
  songId: number,
  filepath: string,
  format: string,
): PlayablePathResult {
  const fmt = format.toLowerCase();
  if (!['m4a', 'm4b', 'm4p'].includes(fmt)) {
    return { path: filepath, ready: true };
  }

  // Jika cache transcode sudah ada dan valid, langsung layani
  if (isTranscodeReady(songId, filepath)) {
    return { path: transcodePath(songId), ready: true };
  }

  // Cek apakah file ini memang ALAC
  if (!isAlacCodec(fmt, null, filepath)) {
    // Bukan ALAC (misal AAC m4a biasa), langsung layani file asli
    return { path: filepath, ready: true };
  }

  // File ALAC tapi belum ditranscode: picu background transcode & kembalikan status belum siap
  triggerBackgroundTranscode(songId, filepath);
  return { path: transcodePath(songId), ready: false };
}

/** Kompatibilitas mundur untuk pemanggil lama. */
export function playablePathFor(
  songId: number,
  filepath: string,
  format: string,
  codec?: string | null,
): string {
  if (!['m4a', 'm4b', 'm4p'].includes(format.toLowerCase())) return filepath;
  if (isTranscodeReady(songId, filepath)) return transcodePath(songId);
  if (!isAlacCodec(format, codec, filepath)) return filepath;
  const ok = transcodeSong(songId, filepath);
  return ok ? transcodePath(songId) : filepath;
}
