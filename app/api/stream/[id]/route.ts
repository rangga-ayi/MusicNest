import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { mimeFor } from '@/lib/mime';
import { getPlayablePath } from '@/lib/transcode';
import { streamLimiter } from '@/lib/rateLimit';
import { createReadStream, existsSync, statSync } from 'fs';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

function toWeb(stream: NodeJS.ReadableStream): ReadableStream {
  return Readable.toWeb(stream as any) as unknown as ReadableStream;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rate = streamLimiter.check(req);
  if (!rate.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(rate.retryAfter),
      },
    });
  }

  const { id } = await params;
  const songId = Number(id);
  if (!Number.isInteger(songId)) {
    return Response.json({ error: 'ID lagu tidak valid' }, { status: 400 });
  }

  const [rows] = await pool.query<any[]>(
    'SELECT filepath, format FROM songs WHERE id = ?', [songId]
  );
  const song = rows[0] as { filepath: string; format: string } | undefined;
  if (!song) {
    return Response.json({ error: 'Lagu tidak ditemukan' }, { status: 404 });
  }

  // Verifikasi ketersediaan file fisik di disk dengan try/catch aman
  try {
    if (!existsSync(song.filepath)) {
      return Response.json({ error: 'File audio tidak ditemukan di disk' }, { status: 404 });
    }
  } catch {
    return Response.json({ error: 'File audio tidak ditemukan di disk' }, { status: 404 });
  }

  // Dapatkan path stream: jika ALAC belum siap di transcode cache, respons 409 tanpa blocking HTTP
  const playableInfo = getPlayablePath(songId, song.filepath, song.format);
  if (!playableInfo.ready) {
    return Response.json(
      { error: 'Audio sedang diproses. Silakan coba beberapa saat lagi.' },
      { status: 409, headers: { 'Retry-After': '3' } }
    );
  }

  const playable = playableInfo.path;
  let size: number;
  try {
    if (!existsSync(playable)) {
      return Response.json({ error: 'File audio tidak ditemukan di disk' }, { status: 404 });
    }
    size = statSync(playable).size;
  } catch {
    return Response.json({ error: 'File audio tidak ditemukan di disk' }, { status: 404 });
  }

  const mime = playable === song.filepath ? mimeFor(song.format) : 'audio/mp4';
  const range = req.headers.get('range');

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      let start = m[1] ? Number(m[1]) : 0;
      let end = m[2] ? Number(m[2]) : size - 1;
      if (start > end || end >= size) end = size - 1;
      if (start >= size) {
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${size}` },
        });
      }
      try {
        return new Response(toWeb(createReadStream(playable, { start, end })), {
          status: 206,
          headers: {
            'Content-Type': mime,
            'Content-Length': String(end - start + 1),
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
          },
        });
      } catch {
        return Response.json({ error: 'Gagal membaca stream audio' }, { status: 404 });
      }
    }
  }

  try {
    return new Response(toWeb(createReadStream(playable)), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return Response.json({ error: 'Gagal membaca stream audio' }, { status: 404 });
  }
}