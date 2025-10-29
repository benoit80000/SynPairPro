'use client';
export type TokenIndicators = {
  ema20?: number; ema60?: number; rsi14?: number; vol30?: number; z30?: number;
  bb_mid?: number; bb_upper?: number; bb_lower?: number;
  signal?: 'bullish' | 'neutral' | 'bearish';
};
function ema(values:number[], period:number){ if(values.length===0) return; const k=2/(period+1); let e=values[0]; for(let i=1;i<values.length;i++) e = values[i]*k + e*(1-k); return e; }
function rsi(values:number[], period=14){ if(values.length<period+1) return; let gains=0,losses=0; for(let i=1;i<=period;i++){const d=values[i]-values[i-1]; if(d>=0) gains+=d; else losses-=d;} let ag=gains/period, al=losses/period; for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1]; ag=(ag*(period-1)+Math.max(d,0))/period; al=(al*(period-1)+Math.max(-d,0))/period;} if(al===0) return 100; const rs=ag/al; return 100-100/(1+rs); }
function std(values:number[]){ if(values.length<2) return; const m=values.reduce((a,b)=>a+b,0)/values.length; const v=values.reduce((s,x)=>s+(x-m)**2,0)/(values.length-1); return Math.sqrt(v); }
export function computeIndicators(prices:number[]): TokenIndicators {
  const ema20 = ema(prices.slice(-100), 20);
  const ema60 = ema(prices.slice(-300), 60);
  const r = rsi(prices.slice(-200), 14);
  const win = prices.slice(-20);
  const mid = win.length ? (win.reduce((a,b)=>a+b,0)/win.length) : undefined;
  const s = std(win);
  const bb_mid = mid;
  const bb_upper = (mid!==undefined && s!==undefined) ? mid + 2*s : undefined;
  const bb_lower = (mid!==undefined && s!==undefined) ? mid - 2*s : undefined;
  const last30 = prices.slice(-30);
  const vol30 = std(last30);
  let z30: number | undefined;
  if (last30.length>=2) {
    const m=last30.reduce((a,b)=>a+b,0)/last30.length; const sd=std(last30)!; if(sd&&sd>0) z30=(last30[last.length-1]-m)/sd;
  }
  let signal:'bullish'|'neutral'|'bearish'='neutral';
  if (ema20 && ema60 && r !== undefined) {
    if (ema20 > ema60 && r > 55) signal='bullish';
    else if (ema20 < ema60 && r < 45) signal='bearish';
  }
  return { ema20, ema60, rsi14: r, vol30, z30, bb_mid, bb_upper, bb_lower, signal };
}
