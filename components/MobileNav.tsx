'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Beranda', icon: <path d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z" /> },
  { href: '/artists', label: 'Artis', icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" /> },
  { href: '/albums', label: 'Album', icon: <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /> },
  { href: '/favorites', label: 'Favorit', icon: <path d="M12 21s-7.5-4.6-10-9.5C.6 8.4 2.5 5 5.8 5c2 0 3.6 1.1 4.4 2.8A8 8 0 0 1 14.6 5c3.3 0 5.2 3.4 3.8 6.5C19 16.4 12 21 12 21z" /> },
  { href: '/playlists', label: 'Playlist', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  { href: '/settings', label: 'Pengaturan', icon: <path d="M4 8h16M4 16h16M8 3v10M16 11v10" /> },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/[0.07] bg-[#0c0c10]/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.6)]" aria-label="Navigasi utama">
      <div className="flex">
        {ITEMS.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-1 flex-1 py-2.5 min-h-[56px] justify-center ${
                active ? 'text-accent' : 'text-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {it.icon}
              </svg>
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
