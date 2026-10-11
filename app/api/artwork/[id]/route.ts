import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import { DATA_DIR } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (path.basename(id) !== id) {
      return Response.json({ error: 'ID artwork tidak valid' }, { status: 400 });
    }
    const file = path.join(DATA_DIR, 'artworks', id);
    if (!fs.existsSync(file)) {
      return Response.json({ error: 'Artwork tidak ditemukan' }, { status: 404 });
    }
    const buf = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return new Response(buf, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return Response.json({ error: 'Artwork tidak ditemukan' }, { status: 404 });
  }
}