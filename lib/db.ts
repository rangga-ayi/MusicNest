import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export const MUSIC_DIR = process.env.MUSIC_DIR ?? path.join(process.cwd(), 'music');
export const DATA_DIR  = process.env.DATA_DIR  ?? path.join(process.cwd(), 'data');
fs.mkdirSync(path.join(DATA_DIR, 'artworks'), { recursive: true });

// Pool koneksi (shared antar route handler + Server Component)
export const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     ?? 'localhost',
  port:     Number(process.env.MYSQL_PORT ?? 3306),
  user:     process.env.MYSQL_USER     ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'music_nest',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

// Bootstrap schema (jalan sekali saat startup)
let bootstrapped = false;
export async function ensureSchema() {
  if (bootstrapped) return;
  const sql = fs.readFileSync(path.join(process.cwd(), 'lib', 'schema.sql'), 'utf8');
  // buang baris komentar & kosong DULU, baru split per-statement
  const stmts = sql
    .split('\n').filter(l => l.trim() && !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  const conn = await pool.getConnection();
  try {
    // 1. Eksekusi skema kritis (tabel utama): gagalkan startup jika ada error
    for (const s of stmts) {
      try {
        await conn.query(s);
      } catch (err: any) {
        console.error(`[ensureSchema] Critical schema statement failed:\n${s}\nError: ${err?.message ?? err}`);
        throw new Error(`Inisialisasi skema database kritis gagal pada query: "${s}". Pesan: ${err?.message ?? err}`);
      }
    }

    // 2. Eksekusi migrasi tambahan: log setiap kegagalan (misal index/kolom sudah ada)
    const migrationQueries = [
      'ALTER TABLE artists ADD FULLTEXT INDEX idx_fts_artist (name)',
      'ALTER TABLE albums ADD FULLTEXT INDEX idx_fts_album (name)',
      'ALTER TABLE songs ADD FULLTEXT INDEX idx_fts_song (title)',
      'ALTER TABLE artists ADD COLUMN avatar VARCHAR(255) NULL',
      'ALTER TABLE artists ADD COLUMN bio TEXT NULL',
      'ALTER TABLE albums ADD COLUMN description TEXT NULL',
    ];
    for (const q of migrationQueries) {
      try {
        await conn.query(q);
      } catch (err: any) {
        // Jangan menelan error tanpa jejak: selalu log query yang gagal
        console.error(`[ensureSchema] Migration query failed: "${q}" - ${err?.message ?? err}`);
      }
    }
  } finally {
    conn.release();
  }
  bootstrapped = true;
}
// ponytail: bootstrap schema sekali saja; cukup untuk personal project. Untuk multi-instance ganti dengan migration tool.
