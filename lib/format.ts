/** ms → "mm:ss" (jam → "h:mm:ss"). */
export function fmtDuration(ms: number | null): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '--:--';
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Format durasi total library dalam jam dan menit (misal: "2 jam 45 mnt" atau "18 menit"). */
export function fmtTotalDuration(ms: number | null): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '0 menit';
  const totalSeconds = Math.round(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} mnt`;
  return `${m} menit`;
}