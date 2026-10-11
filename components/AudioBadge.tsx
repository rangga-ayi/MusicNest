'use client';

import { getAudioBadge, AudioBadgeType } from '@/lib/audioBadge';

interface AudioBadgeProps {
  format?: string | null;
  sampleRate?: number | null;
  bitrate?: number | null;
  size?: 'xs' | 'sm';
  className?: string;
}

export default function AudioBadge({
  format,
  sampleRate,
  bitrate,
  size = 'xs',
  className = '',
}: AudioBadgeProps) {
  const badge = getAudioBadge(format, sampleRate, bitrate);
  if (!badge) return null;

  const sizeCls = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5 leading-none'
    : 'text-[10px] px-2 py-0.5 leading-tight';

  if (badge === 'HI-RES') {
    return (
      <span
        title={`Hi-Res Lossless (${sampleRate ? `${Math.round(sampleRate / 1000)} kHz` : '24-bit'})`}
        className={`inline-flex items-center font-bold tracking-wider uppercase rounded-md border border-accent/40 bg-accent/10 text-accent ${sizeCls} ${className}`}
      >
        Hi-Res
      </span>
    );
  }

  if (badge === 'LOSSLESS') {
    return (
      <span
        title="Lossless Audio (Kualitas CD 16-bit / 44.1 kHz)"
        className={`inline-flex items-center font-bold tracking-wider uppercase rounded-md border border-white/20 bg-white/10 text-white/90 ${sizeCls} ${className}`}
      >
        Lossless
      </span>
    );
  }

  return (
    <span
      title={`Audio ${badge}`}
      className={`inline-flex items-center font-medium tracking-wider uppercase rounded-md border border-white/10 bg-white/5 text-muted ${sizeCls} ${className}`}
    >
      {badge}
    </span>
  );
}
