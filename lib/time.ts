export function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const s = Math.max(1, Math.floor((Date.now() - ts)/1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s/60); if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m/60); return `il y a ${h}h`;
}
