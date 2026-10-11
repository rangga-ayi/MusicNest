export type AudioBadgeType = 'HI-RES' | 'LOSSLESS' | 'AAC' | 'MP3' | null;

/**
 * Menentukan tingkatan kualitas audio berdasarkan format file, sample rate, dan bitrate.
 * Mengikuti standar industri pemutar musik modern (Apple Music & audiophile specs):
 * - HI-RES: Format lossless (FLAC, WAV, ALAC) dengan sample rate > 48.000 Hz (> 48 kHz).
 * - LOSSLESS: Format audio murni lossless (FLAC, ALAC, WAV) resolusi CD (44.1 / 48 kHz).
 * - AAC: Format lossy efisiensi tinggi (AAC, M4A AAC).
 * - MP3: Format MP3 standar.
 */
export function getAudioBadge(
  format?: string | null,
  sampleRate?: number | null,
  bitrate?: number | null
): AudioBadgeType {
  if (!format) return null;
  const f = format.toLowerCase().trim();

  if (['flac', 'wav', 'alac'].includes(f)) {
    if (sampleRate && sampleRate > 48000) {
      return 'HI-RES';
    }
    return 'LOSSLESS';
  }

  // M4A dengan bitrate tinggi (> 800 kbps) biasanya adalah ALAC
  if (f === 'm4a' && bitrate && bitrate > 800000) {
    if (sampleRate && sampleRate > 48000) {
      return 'HI-RES';
    }
    return 'LOSSLESS';
  }

  if (f === 'aac' || f === 'm4a') {
    return 'AAC';
  }

  if (f === 'mp3') {
    return 'MP3';
  }

  if (['ogg', 'opus'].includes(f)) {
    return f.toUpperCase() as AudioBadgeType;
  }

  return null;
}
