export type TF = '1m'|'5m'|'1h'|'4h'|'1d'|'7d'|'30d';
export type IndicatorKey = 'rsi14'|'ema20'|'ema60'|'bb'|'sigma30'|'z30';
export const ALL_INDICATORS: IndicatorKey[] = ['rsi14','ema20','ema60','bb','sigma30','z30'];

export function loadTF(): TF {
  if (typeof window==='undefined') return '1m';
  return (localStorage.getItem('tf') as TF) || '1m';
}
export function saveTF(tf: TF){ if (typeof window!=='undefined') localStorage.setItem('tf', tf); }

export function loadIndicators(): IndicatorKey[] {
  if (typeof window==='undefined') return ALL_INDICATORS;
  try {
    const raw = localStorage.getItem('indicators'); if (!raw) return ALL_INDICATORS;
    const arr = JSON.parse(raw); if (!Array.isArray(arr)) return ALL_INDICATORS;
    return arr.filter((k: any)=> ALL_INDICATORS.includes(k));
  } catch { return ALL_INDICATORS; }
}
export function saveIndicators(list: IndicatorKey[]){
  if (typeof window!=='undefined') localStorage.setItem('indicators', JSON.stringify(list));
}

export function toggleTheme(){
  if (typeof window==='undefined') return;
  const root = document.documentElement;
  const isLight = root.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
export function getTheme(): 'light'|'dark' {
  if (typeof window==='undefined') return 'dark';
  return (localStorage.getItem('theme') as any) || 'dark';
}
