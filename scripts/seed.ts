import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ensureSchema, pool, MUSIC_DIR } from '../lib/db';
import { scanLibrary } from '../lib/scanner';

try { process.loadEnvFile('.env.local'); } catch {}
try { process.loadEnvFile('.env'); } catch {}

const AUDIO_EXT = new Set(['.mp3', '.flac', '.m4a', '.m4b', '.m4p', '.aac', '.ogg', '.opus', '.wav', '.wma']);

function countAudioFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countAudioFiles(full);
    else if (AUDIO_EXT.has(path.extname(entry.name).toLowerCase())) count++;
  }
  return count;
}

const DEMO_TRACKS = [
  {
    filename: 'Solaris - Summer Breeze.mp3',
    title: 'Summer Breeze',
    artist: 'Solaris',
    album: 'Coastal Horizon',
    track: 1,
    year: 2024,
    freq: '440',
  },
  {
    filename: 'Neon Pulse - Midnight Drive.mp3',
    title: 'Midnight Drive',
    artist: 'Neon Pulse',
    album: 'Synthwave Dreams',
    track: 1,
    year: 2024,
    freq: '523.25',
  },
  {
    filename: 'Neon Pulse - Electric Sunset.mp3',
    title: 'Electric Sunset',
    artist: 'Neon Pulse',
    album: 'Synthwave Dreams',
    track: 2,
    year: 2024,
    freq: '659.25',
  },
  {
    filename: 'Lo-Fi Lounge - Coffee and Rain.mp3',
    title: 'Coffee & Rain',
    artist: 'Lo-Fi Lounge',
    album: 'Study Sessions',
    track: 1,
    year: 2023,
    freq: '392',
  },
];

async function seed() {
  console.log('🎵 Menyiapkan dataset demo MusicNest...');
  fs.mkdirSync(MUSIC_DIR, { recursive: true });

  const existingCount = countAudioFiles(MUSIC_DIR);

  // Jika folder music masih kosong, salin dari ./Music atau buat demo sintetis dengan ffmpeg
  if (existingCount === 0) {
    const sourceMusicFolder = path.join(process.cwd(), 'Music');
    let copied = 0;

    if (fs.existsSync(sourceMusicFolder) && path.resolve(sourceMusicFolder) !== path.resolve(MUSIC_DIR)) {
      for (const file of fs.readdirSync(sourceMusicFolder)) {
        if (AUDIO_EXT.has(path.extname(file).toLowerCase())) {
          fs.copyFileSync(path.join(sourceMusicFolder, file), path.join(MUSIC_DIR, file));
          copied++;
        }
      }
    }

    if (copied > 0) {
      console.log(`✓ Menyalin ${copied} file musik bebas royalti ke ${MUSIC_DIR}`);
    } else {
      console.log(`⚙️ Membuat ${DEMO_TRACKS.length} file demo audio dengan metadata ID3 via ffmpeg...`);
      for (const track of DEMO_TRACKS) {
        const outPath = path.join(MUSIC_DIR, track.filename);
        try {
          execFileSync('ffmpeg', [
            '-f', 'lavfi',
            '-i', `sine=frequency=${track.freq}:duration=5`,
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            '-metadata', `title=${track.title}`,
            '-metadata', `artist=${track.artist}`,
            '-metadata', `album=${track.album}`,
            '-metadata', `track=${track.track}`,
            '-metadata', `date=${track.year}`,
            '-y',
            outPath,
          ], { stdio: 'ignore' });
        } catch {
          // Fallback anullsrc jika sine filter gagal
          execFileSync('ffmpeg', [
            '-f', 'lavfi',
            '-i', 'anullsrc=r=44100:cl=stereo',
            '-t', '5',
            '-c:a', 'libmp3lame',
            '-metadata', `title=${track.title}`,
            '-metadata', `artist=${track.artist}`,
            '-metadata', `album=${track.album}`,
            '-y',
            outPath,
          ], { stdio: 'ignore' });
        }
      }
      console.log(`✓ File demo audio berhasil dibuat di ${MUSIC_DIR}`);
    }
  } else {
    console.log(`ℹ️ Ditemukan ${existingCount} file audio di ${MUSIC_DIR}`);
  }

  console.log('🔄 Memeriksa skema database...');
  await ensureSchema();

  console.log('🔍 Memindai pustaka musik ke database...');
  try {
    const r = await scanLibrary();
    console.log(`\n🎉 Seed berhasil!`);
    console.log(`- File diproses : ${r.files}`);
    console.log(`- Total Artis   : ${r.artists}`);
    console.log(`- Total Album   : ${r.albums}`);
    console.log(`- Total Lagu    : ${r.songs}`);
    console.log(`\nSekarang Anda dapat menjalankan: npm run dev\n`);
  } finally {
    await pool.end();
  }
}

seed().catch((e) => {
  console.error('❌ Gagal menjalankan seed:', e.message);
  process.exit(1);
});
