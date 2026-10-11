<h1 align="center">
  🎵 MusicNest
</h1>

<p align="center">
  <strong>Pemutar musik pribadi berbasis web, self-hosted, dan berjalan di jaringan lokal (LAN).</strong><br/>
  Dirancang untuk mereka yang ingin menikmati koleksi musik lokal dengan pengalaman se-modern Spotify atau YouTube Music.<br/>
  Dibuat oleh Saya ( + claude :) )
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=nextdotjs" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4?logo=windows" alt="Windows"/>
</p>

---

## Fitur Utama

### Pemutar Musik & Audio Modern

- Kontrol Play / Pause / Next / Prev
- **Player bar** persisten di bawah layar, tersedia di semua halaman dengan efek *glassmorphism backdrop-blur*
- **Full Player** mode layar penuh, bisa dibuka dengan klik artwork
- **Vinyl spin** — album art berputar seperti piringan hitam saat lagu diputar
- **Seek bar** interaktif dengan dukungan klik & drag
- **Kontrol volume** termasuk tombol mute
- **Keyboard shortcuts**: `Space` (putar/jeda), `M` (mute), `Esc` (tutup Full Player)
- **Pemulihan Sesi (Resume Playback)** — otomatis menyimpan lagu aktif, antrean, dan timestamp terakhir ke `localStorage` sehingga pemutaran dapat langsung dilanjutkan saat aplikasi dibuka kembali
- **Media Session API** — terintegrasi dengan lock-screen dan notification center HP/laptop (judul, artis, album, artwork, dan kontrol media)
- **Indikator Kualitas Audio** — badge real-time (Hi-Res Lossless, Lossless, AAC, MP3) di PlayerBar, FullPlayer, dan tracklist
- **Ambient Artwork Glow** — pencahayaan pendaran warna yang membaur dengan sampul album di area hero dan halaman album

### Mode Pemutaran

- **Shuffle** — mengacak urutan lagu dalam antrean aktif
- **Shuffle All** — memuat dan memutarkan seluruh koleksi perpustakaan secara acak, lintas artis dan album
- **Repeat Off / Repeat All / Repeat One** — tiga mode siklus putar

### Manajemen Perpustakaan

- **Pemindai Otomatis** (`/settings`) — mendeteksi semua file audio secara rekursif di `MUSIC_DIR`
- **Scan Lock & Rate Limiting** — endpoint scan diproteksi mutex lock (HTTP 409 jika scan sedang berjalan) serta token-bucket rate limiter (HTTP 429) untuk mencegah DoS
- **Rescan idempotent** — hanya memproses file yang baru atau berubah (berdasarkan `mtime` dan ukuran)
- **Penghapusan otomatis** — lagu yang filenya sudah dihapus dari disk akan otomatis dibersihkan dari database
- **Format didukung:** `.mp3` · `.flac` · `.m4a` · `.m4b` · `.aac` · `.ogg` · `.opus` · `.wav` · `.wma`

### Pencarian

- **Pencarian real-time** di seluruh perpustakaan (lagu, artis, album), tanpa perlu tekan Enter
- **Full-Text Search** MySQL dengan pembobotan skor relevansi
- **Fuzzy fallback** ke `LIKE` otomatis jika FTS tidak menemukan hasil atau query < 3 karakter
- **Top Result** — menampilkan hasil paling relevan di bagian atas

### Halaman & Navigasi

| Halaman                             | Deskripsi                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| **Beranda**                         | Hero banner dengan ambient glow, ringkasan 4 statistik library, album & lagu |
| **Artis** (`/artists`)              | Grid semua artis                                                             |
| **Halaman Artis** (`/artists/[id]`) | Foto, biografi, diskografi album & singles, lagu teratas                     |
| **Album** (`/albums`)               | Grid semua album dengan hover play button melayang                           |
| **Halaman Album** (`/albums/[id]`)  | Header ambient glow, badge audio kualitas terbaik, tracklist tabel presisi   |
| **Favorit** (`/favorites`)          | Kumpulan lagu yang telah di-like                                             |
| **Playlist** (`/playlists`)         | Buat dan kelola playlist kustom                                              |
| **Pencarian** (`/search`)           | Hasil pencarian terkelompok (artis, album, lagu)                             |
| **Pengaturan** (`/settings`)        | Statistik perpustakaan & tombol scan dengan proteksi lock                    |

### Metadata Artis Otomatis

Saat halaman artis dibuka pertama kali, MusicNest otomatis mengambil dan menyimpan:

- **Foto artis**: Deezer API → iTunes Search API → fallback ke cover album lokal
- **Biografi artis**: Wikipedia Bahasa Indonesia → Wikipedia Bahasa Inggris
- Mendukung **query multi-variasi** untuk artis kolaborasi / duo

### Full Player (Layar Penuh)

- **3 slide geser** (swipe kiri/kanan atau panah desktop):
  1. **Cover** — vinyl art berputar, judul, artis, dan badge kualitas audio
  2. **Lirik** — lirik `.lrc` sinkron dengan waktu, auto-scroll
  3. **Metadata** — informasi teknis file (format, bitrate, sample rate, ukuran)
- **Tombol Favorit**, **Tambah ke Playlist**, **Shuffle**, dan **Repeat** langsung di Full Player
- **Latar belakang blur dinamis** berdasarkan warna artwork lagu aktif

### Responsif & Aksesibel

- **Mobile-first** dengan bottom navigation bar ber-glassmorphism untuk layar kecil
- **Desktop sidebar** sticky dengan navigasi dan tombol aksi cepat
- **Tracklist Presisi** — nomor lagu berganti tombol putar saat hover, equalizer animasi aktif saat playing, durasi menggunakan format `tabular-nums`
- Mendukung **`prefers-reduced-motion`** — semua animasi dinonaktifkan jika pengguna memilih ini
- **`focus-visible`** ring untuk navigasi keyboard aksesibel

### Teknis & Infrastruktur

- **Streaming audio** dengan dukungan HTTP `Range` requests (seek tanpa buffering ulang penuh)
- **Pre-transcode latar belakang** — file ALAC (`.m4a`) di-transcode ke AAC saat library scan dan di-cache di `data/transcodes/`, menjamin request streaming instan tanpa memblokir server
- **Bebas command injection** — eksekusi `ffmpeg` menggunakan `child_process.execFile` dengan array argumen terisolasi
- **PM2-ready** untuk menjalankan aplikasi sebagai background service di Windows
- **Akses LAN** — bisa diakses dari perangkat lain di jaringan yang sama
- **Continuous Integration (CI)** — GitHub Actions menjalankan linter, build, dan Playwright test otomatis pada setiap push/PR

---

## Screenshots

<div align="center">
  <img src="public/screenshots/home.avif" alt="Home"/>
  <p>Beranda</p> <br>
  <img src="public/screenshots/full-player.avif" alt="Full Player"/>
  <p>Full Player</p> <br>
  <img src="public/screenshots/Detail_Artist.avif" alt="Detail Artist"/>
  <p>Detail Artist</p> <br>
  <img src="public/screenshots/Detail_Album.avif" alt="Detail Album"/>
  <p>Detail Album</p> <br>
  <img src="public/screenshots/search.avif" alt="Search"/>
  <p>Search</p>
</div>

---

## Persyaratan Sistem

| Komponen    | Minimum                             | Catatan                                                                  |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **OS**      | Windows 10/11                       | Dioptimalkan untuk Windows; Linux belum diuji                            |
| **Node.js** | v20 LTS+                            | [nodejs.org](https://nodejs.org)                                         |
| **MySQL**   | 8.0+                                | Atau MariaDB 10.5+                                                       |
| **ffmpeg**  | Terbaru                             | Wajib untuk streaming ALAC & transcode. [ffmpeg.org](https://ffmpeg.org) |
| **Browser** | Chrome 90+ / Firefox 90+ / Edge 90+ | Browser modern dengan dukungan `<audio>` HTML5                           |

> `ffmpeg` dan `ffprobe` harus tersedia di **PATH** sistem. Verifikasi dengan `ffmpeg -version` di terminal.

---

## Instalasi & Setup

### Quickstart (Dataset Demo)

Untuk mencoba aplikasi secara instan dengan dataset demo tanpa perlu memiliki koleksi musik fisik:

```bash
git clone https://github.com/RLA07/MusicNest.git
cd musicnest
npm install
cp .env.example .env.local # sesuaikan kredensial MySQL jika perlu
npm run seed
npm run dev
```

Buka **http://localhost:3030** di browser.

---

### Setup Manual & Koleksi Lengkap

#### 1. Clone Repositori

```bash
git clone https://github.com/RLA07/MusicNest.git
cd musicnest
```

#### 2. Instal Dependensi

```bash
npm install
```

#### 3. Konfigurasi Environment

Salin file contoh, sesuaikan:

```bash
cp .env.example .env.local
```

Buka `.env.local` dan sesuaikan variabel koneksi:

```env
MUSIC_DIR=./music # Path absolut atau relatif ke folder koleksi audio
DATA_DIR=./data
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password_kamu
MYSQL_DATABASE=music_nest
ALLOWED_DEV_ORIGINS=192.168.1.* # Opsional: akses LAN pada mode dev
```

#### 4. Buat Database MySQL

Skema dibuat otomatis saat pertama kali aplikasi atau seed dijalankan. Pastikan database kosong sudah dibuat:

```sql
CREATE DATABASE music_nest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 5. Siapkan Data Demo atau Pindai Library

- **Opsi A: Pakai Dataset Demo**
  ```bash
  npm run seed
  ```
  Menghasilkan sample audio, artwork, dan mengisi database dengan beberapa lagu demo untuk pengetesan cepat.

- **Opsi B: Pindai Koleksi Sendiri**
  Taruh file musik ke dalam folder `MUSIC_DIR`, lalu jalankan:
  ```bash
  npm run scan
  ```

#### 6. Build & Jalankan

Mode pengembangan:
```bash
npm run dev
```

Mode produksi:
```bash
npm run build
npm start
```

Aplikasi berjalan di **http://localhost:3030**.

#### 7. Testing & Lint

```bash
npm run lint   # Type-check TypeScript strict
npm test       # Playwright end-to-end smoke tests (port 3031)
```

---

## Menjalankan Sebagai Background Service (PM2)

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

| Perintah                | Fungsi                 |
| ----------------------- | ---------------------- |
| `pm2 status`            | Cek status             |
| `pm2 logs musicnest`    | Lihat log real-time    |
| `pm2 restart musicnest` | Restart setelah update |
| `pm2 stop musicnest`    | Hentikan server        |

---

## Memindai Perpustakaan

Buka **http://localhost:3030/settings** → klik **"Scan Perpustakaan"**.

MusicNest akan:

1. Membaca seluruh file audio rekursif dari `MUSIC_DIR`
2. Mengekstrak metadata dari tag ID3 / Vorbis
3. Mengekstrak dan menyimpan artwork album
4. Menyimpan semua data ke MySQL

> Scan ulang aman kapan saja — hanya file baru atau yang berubah yang diproses.

Alternatif via CLI:

```bash
npm run scan
```

---

## Lirik Sinkron (.lrc)

Tempatkan `.lrc` di folder yang sama dengan file audio, nama file harus sama:

```
music/Artist/Album/01 - Lagu Indah.mp3
music/Artist/Album/01 - Lagu Indah.lrc
```

Jalankan scan ulang, buka Full Player → slide **Lirik**.

---

## Struktur Folder

```
musicnest/
├── .github/                # CI workflow (GitHub Actions)
├── app/                    # Next.js App Router (halaman, API, loading, error, icon)
│   ├── api/                # Routes: artwork, favorite, lyrics, playlists, scan, search, song, stream
│   ├── albums/             # Daftar & detail album
│   ├── artists/            # Daftar & detail artis
│   ├── favorites/          # Lagu favorit
│   ├── playlists/          # Daftar & detail playlist
│   ├── search/             # Hasil pencarian
│   ├── settings/           # Pengaturan & scan
│   ├── icon.svg            # Favicon SVG aplikasi
│   ├── loading.tsx         # Global loading skeleton
│   ├── error.tsx           # Global error boundary
│   └── page.tsx            # Beranda dengan statistik & ambient glow
├── components/             # React (PlayerProvider, PlayerBar, FullPlayer, Sidebar, AudioBadge, MediaCard, SongList)
├── lib/                    # Utilities (db, schema, scanner, metadata, transcode, rateLimit, audioBadge, search, lyrics)
├── scripts/                # Scripts (seed.ts untuk dataset demo)
├── tests/                  # Playwright end-to-end smoke tests
├── data/                   # Runtime data di-ignore (artworks/ → transcodes/)
├── .env.example
├── ecosystem.config.cjs
├── playwright.config.ts
└── package.json
```

---

## Skema Database

```
artists, albums, songs, lyrics, favorites, playlists, playlist_songs, settings
```

---

## Keyboard Shortcuts

| Shortcut | Aksi                       |
| -------- | -------------------------- |
| `Space`  | Putar / Jeda               |
| `M`      | Mute / Unmute              |
| `Esc`    | Tutup Full Player          |
| `← / →`  | Geser slide di Full Player |

---

## Keterbatasan yang Diketahui

| Keterbatasan               | Keterangan                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single-user**            | Tidak ada autentikasi bawaan. Disengaja untuk arsitektur personal/LAN (dapat diproteksi via Cloudflare Access/reverse proxy jika publik).  |
| **Tidak ada HTTPS bawaan** | Server berjalan plain HTTP (port 3030). Untuk HTTPS publik, disarankan menggunakan Cloudflare Tunnel atau reverse proxy (Caddy/Nginx).     |
| **Shuffle All memory**     | Memuat hingga 500 lagu acak sekaligus ke memori browser untuk antrean pemutaran instan.                                                      |
| **Metadata artis**         | Bergantung pada API eksternal (Deezer, iTunes, Wikipedia) yang membutuhkan koneksi internet saat artis pertama kali dibuka.                  |

---

## Stack Teknologi

| Komponen            | Teknologi                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| **Framework**       | [Next.js 16](https://nextjs.org/) (App Router + Turbopack)                   |
| **UI**              | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database**        | MySQL 8+ via `mysql2` (Pool koneksi + bootstrap schema otomatis)             |
| **Metadata Audio**  | `music-metadata`                                                             |
| **Transcode**       | `ffmpeg` + `ffprobe` via `child_process.execFile` (Pre-transcode saat scan)  |
| **Pencarian**       | MySQL FULLTEXT Boolean Mode + Fuzzy `LIKE` fallback                          |
| **Optimasi Gambar** | `sharp`                                                                      |
| **Testing**         | `@playwright/test` (End-to-End smoke tests)                                  |
| **CI/CD**           | GitHub Actions (lint, build, smoke tests)                                    |
| **Process Manager** | PM2                                                                          |
| **Font**            | DM Sans                                                                      |

---

## Lisensi

Proyek ini bersifat pribadi. Gunakan hanya untuk koleksi musik yang kamu miliki secara legal.
