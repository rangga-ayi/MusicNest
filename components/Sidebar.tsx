'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import { usePlayer } from './PlayerProvider';

const LINKS = [
  { href: '/', label: 'Beranda', icon: <path d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z" /> },
  { href: '/artists', label: 'Artis', icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" /> },
  { href: '/albums', label: 'Album', icon: <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /> },
  { href: '/favorites', label: 'Favorit', icon: <path d="M12 21s-7.5-4.6-10-9.5C.6 8.4 2.5 5 5.8 5c2 0 3.6 1.1 4.4 2.8A8 8 0 0 1 14.6 5c3.3 0 5.2 3.4 3.8 6.5C19 16.4 12 21 12 21z" /> },
  { href: '/playlists', label: 'Playlist', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  { href: '/settings', label: 'Pengaturan', icon: <path d="M4 8h16M4 16h16M8 3v10M16 11v10" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const player = usePlayer();
  const [loading, setLoading] = useState(false);

  const handleShuffle = async () => {
    setLoading(true);
    try {
      await player.shuffleAll();
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="hidden md:flex w-60 shrink-0 border-r border-white/[0.06] bg-[#0c0c10]/80 backdrop-blur-2xl flex-col gap-1.5 p-3.5 sticky top-0 h-screen z-20">
      <Link href="/" className="px-3 py-3 font-bold text-2xl tracking-tight text-white flex items-center gap-1.5 group">
        <span>Music<span className="text-accent">Nest</span></span>
        <span className="h-1.5 w-1.5 rounded-full bg-accent opacity-75 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="mb-2"><SearchBar /></div>

      <button
        onClick={handleShuffle}
        disabled={loading}
        className="flex items-center gap-3 px-3.5 py-2.5 mb-2 rounded-xl text-sm font-semibold bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-on-accent hover:shadow-lg hover:shadow-accent/20 transition-all duration-200 cursor-pointer disabled:opacity-50 active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 3h5v5l-2.5-2.5-3.2 3.2-1.4-1.4 3.2-3.2L16 3zM3 5h3a8 8 0 0 1 6 2.7l2.4 2.9A8 8 0 0 0 9 19H3v-2h6a6 6 0 0 0 4.5-2l2.4-2.9a8 8 0 0 1 6-2.1h.1V8a6 6 0 0 0-4.5 2l-2.4 2.9A8 8 0 0 0 9 7H3V5z" />
        </svg>
        {loading ? 'Memuat...' : 'Acak Semua'}
      </button>

      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-white/[0.08] text-foreground font-semibold border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                : 'text-muted hover:text-foreground hover:bg-white/[0.04]'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={active ? 'text-accent' : 'text-muted'}>
              {l.icon}
            </svg>
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}