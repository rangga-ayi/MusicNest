'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary caught error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-8 shadow-2xl space-y-6">
        <div className="w-14 h-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Halaman gagal dimuat. Hal ini mungkin terjadi karena kendala jaringan atau database sementara.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="rounded-full border border-border bg-surface-hover px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-hover/80 transition-colors inline-flex items-center justify-center"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
