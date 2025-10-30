// === Outils indicateurs ===
// (robustes: retournent undefined si les données sont insuffisantes)

export function ema(values: number[], period: number): number | undefined {
  if (!values?.length || period <= 0) return;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

export function sma(values: number[], period: number): number | undefined {
  if (!values || values.length < period) return;
  const w = values.slice(-period);
  return w.reduce((a,b)=>a+b,0) / period;
}

export function rsi(values: number[], period = 14): number | undefined {
  if (!values || values.length < period + 1) return;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (al === 0) return 100;
  const rs = ag / al;
  return 100 - 100 / (1 + rs);
}

export function std(values: number[]): number | undefined {
  if (!values || values.length < 2) return;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(v);
}

export function bollinger(values: number[], period = 20, mult = 2): { mid?: number; upper?: number; lower?: number } {
  if (!values || values.length < period) return {};
  const win = values.slice(-period);
  const mid = win.reduce((a, b) => a + b, 0) / win.length;
  const s = std(win);
  return { mid, upper: s !== undefined ? mid + mult * s : undefined, lower: s !== undefined ? mid - mult * s : undefined };
}

export function zscore(values: number[], period = 30): number | undefined {
  if (!values || values.length < period) return;
  const last = values.slice(-period);
  const m = last.reduce((a, b) => a + b, 0) / last.length;
  const s = std(last);
  if (!s || s === 0) return;
  return (last[last.length - 1] - m) / s;
}

// --- Nouveaux indicateurs ---
export function macd(values: number[], fast=12, slow=26, signal=9):
  { macd?: number; signal?: number; hist?: number } {
  if (!values || values.length < slow + signal) return {};
  // calc EMA rapide/lente sur toute la série
  const emaCalc = (arr:number[], p:number)=>{
    const k = 2/(p+1);
    let e = arr[0];
    for (let i=1;i<arr.length;i++) e = arr[i]*k + e*(1-k);
    return e;
  };
  const macdSeries:number[] = [];
  {
    let ef: number|undefined, es: number|undefined;
    const kf = 2/(fast+1), ks = 2/(slow+1);
    for (let i=0;i<values.length;i++){
      const c = values[i];
      ef = (ef===undefined)? c : c*kf + ef*(1-kf);
      es = (es===undefined)? c : c*ks + es*(1-ks);
      if (ef!==undefined && es!==undefined) macdSeries.push(ef-es);
    }
  }
  if (!macdSeries.length) return {};
  const macdLine = macdSeries[macdSeries.length-1];
  const signalLine = emaCalc(macdSeries.slice(-(signal+50)), signal); // signal sur la fin (stabilise)
  if (signalLine===undefined) return { macd: macdLine };
  return { macd: macdLine, signal: signalLine, hist: macdLine - signalLine };
}

export function atrCloseOnly(values: number[], period=14): number | undefined {
  if (!values || values.length < period+1) return;
  const diffs:number[] = [];
  for (let i=1;i<values.length;i++) diffs.push(Math.abs(values[i]-values[i-1]));
  return sma(diffs, period);
}

export function atrFromHLC(high:number[], low:number[], close:number[], period=14): number | undefined {
  if (!high?.length || !low?.length || !close?.length) return;
  const n = Math.min(high.length, low.length, close.length);
  if (n < period+1) return;
  const tr:number[] = [];
  for (let i=1;i<n;i++){
    const h = high[i], l = low[i], pc = close[i-1];
    const t = Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc));
    tr.push(t);
  }
  return sma(tr, period);
}

export function mfi(typical:number[], volume:number[], period=14): number | undefined {
  if (!typical?.length || !volume?.length) return;
  const n = Math.min(typical.length, volume.length);
  if (n < period+1) return;
  let pos=0, neg=0;
  for(let i=n-period;i<n;i++){
    const money = typical[i]*volume[i];
    const delta = typical[i]-typical[i-1];
    if (delta>=0) pos += money; else neg += money;
  }
  if (pos+neg === 0) return;
  const mr = pos/Math.max(neg,1e-12);
  return 100 - (100/(1+mr));
}

export function stochK(high:number[], low:number[], close:number[], period=14): number | undefined {
  if (!high?.length || !low?.length || !close?.length) return;
  const n = Math.min(high.length, low.length, close.length);
  if (n < period) return;
  const sliceH = high.slice(-period), sliceL = low.slice(-period);
  const hh = Math.max(...sliceH), ll = Math.min(...sliceL);
  if (hh===ll) return;
  const c = close[close.length-1];
  return ((c-ll) / (hh-ll)) * 100;
}

// === Signal agrégé (inchangé) ===
export type Signal = 'buy' | 'neutral' | 'sell';
export function deriveSignal(opts: {
  price?: number;
  ema20?: number;
  ema60?: number;
  rsi14?: number;
  bb?: { mid?: number; upper?: number; lower?: number };
  z30?: number;
}): Signal {
  const { price, ema20, ema60, rsi14, bb, z30 } = opts || {};
  let score = 0;
  if (typeof rsi14 === 'number') {
    if (rsi14 < 35) score += 1;
    if (rsi14 > 65) score -= 1;
  }
  if (typeof price === 'number' && typeof ema20 === 'number') {
    if (price > ema20) score += 0.5; else score -= 0.5;
  }
  if (typeof ema20 === 'number' && typeof ema60 === 'number') {
    if (ema20 > ema60) score += 0.5; else score -= 0.5;
  }
  if (typeof z30 === 'number') {
    if (z30 < -1) score += 0.5;
    if (z30 >  1) score -= 0.5;
  }
  if (bb && typeof price === 'number' && typeof bb.lower === 'number' && typeof bb.upper === 'number') {
    if (price <= bb.lower) score += 0.5;
    if (price >= bb.upper) score -= 0.5;
  }
  if (score >= 1.25) return 'buy';
  if (score <= -1.25) return 'sell';
  return 'neutral';
}
