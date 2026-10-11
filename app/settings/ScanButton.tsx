'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function scan() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setResult(data.error || 'Proses pemindaian sedang berjalan. Harap tunggu hingga selesai.');
          return;
        }
        if (res.status === 429) {
          setResult(data.error || 'Terlalu banyak permintaan pemindaian. Silakan tunggu beberapa saat.');
          return;
        }
        throw new Error(data.error || 'Gagal melakukan pemindaian.');
      }
      setResult(`${data.files} files — ${data.artists} artists, ${data.albums} albums, ${data.songs} songs. New: ${data.newSongs}, Updated: ${data.updated}, Removed: ${data.removed}.`);
      router.refresh();
    } catch (e: any) {
      setResult(`Gagal: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={scan}
        disabled={running}
        className="rounded-full bg-accent px-7 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {running ? 'Scanning...' : 'Scan Library'}
      </button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}