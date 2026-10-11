import Link from 'next/link';

export default function PlaylistCard({ id, name, song_count }: { id: number; name: string; song_count: number }) {
  return (
    <Link href={`/playlists/${id}`} className="group relative flex flex-col w-full rounded-2xl p-3.5 bg-surface/75 hover:bg-surface-hover/80 border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 card-hover active:scale-[0.98] shadow-lg shadow-black/30">
      <div className="relative flex items-center justify-center h-[180px] rounded-xl bg-gradient-to-br from-accent/20 via-surface-hover to-surface border border-white/[0.06] text-accent overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      </div>
      <p className="mt-3 font-semibold text-sm truncate text-foreground group-hover:text-accent transition-colors">{name}</p>
      <p className="text-xs text-muted mt-0.5">{song_count} lagu</p>
    </Link>
  );
}