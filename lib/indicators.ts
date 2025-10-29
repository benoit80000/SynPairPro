export function ema(values: number[], period: number): number | undefined {
  if (!values?.length || period <= 0) return;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
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
