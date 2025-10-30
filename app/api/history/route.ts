import { NextResponse } from 'next/server';
import { ema, rsi, bollinger, std, zscore, sma, macd, atrCloseOnly, atrFromHLC, mfi, stochK } from '@/lib/indicators';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = (searchParams.get('source') || 'binance') as 'binance'|'coingecko'|'coinpaprika'|'coincap';
  const id = searchParams.get('id');
  const tf = searchParams.get('interval') || '1m';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    let close: number[] = [];
    let high: number[] | undefined;
    let low: number[] | undefined;
    let volume: number[] | undefined;

    if (source === 'binance') {
      const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000);
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(id)}&interval=${encodeURIComponent(tf)}&limit=${limit}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      // kline: [openTime, open, high, low, close, volume, ...]
      close = j.map((x:any[]) => Number(x[4]));
      high  = j.map((x:any[]) => Number(x[2]));
      low   = j.map((x:any[]) => Number(x[3]));
      volume= j.map((x:any[]) => Number(x[5]));
    } else if (source === 'coingecko') {
      const days = searchParams.get('days') || '1';
      const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      close = (j?.prices || []).map((p:any[])=> Number(p[1]));
      // Gecko total_volumes: [[ts, vol], ...]
      volume = (j?.total_volumes || []).map((v:any[])=> Number(v[1]));
      // pas de H/L
    } else if (source === 'coinpaprika') {
      const end = new Date();
      const start = new Date(Date.now() - 1000 * 60 * 60 * 48);
      const url = `https://api.coinpaprika.com/v1/coins/${encodeURIComponent(id)}/ohlcv/historical?start=${toISODate(start)}&end=${toISODate(end)}`;
      let r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j) && j.length) {
          close = j.map((x:any)=> Number(x.close));
          high  = j.map((x:any)=> Number(x.high));
          low   = j.map((x:any)=> Number(x.low));
          volume= j.map((x:any)=> Number(x.volume));
        }
      }
      if (close.length < 5) {
        const url2 = `https://api.coinpaprika.com/v1/tickers/${encodeURIComponent(id)}/historical?start=${start.toISOString()}&interval=1h`;
        r = await fetch(url2, { cache: 'no-store' });
        if (r.ok) {
          const jj = await r.json();
          close = (Array.isArray(jj) ? jj : []).map((x:any)=> Number(x.price));
          volume = (Array.isArray(jj) ? jj : []).map((x:any)=> Number(x.volume_24h || 0));
        }
      }
    } else if (source === 'coincap') {
      const end = Date.now();
      const start = end - 1000 * 60 * 60 * 6;
      let url = `https://api.coincap.io/v2/assets/${encodeURIComponent(id)}/history?interval=m1&start=${start}&end=${end}`;
      let r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        url = `https://api.coincap.io/v2/assets/${encodeURIComponent(id)}/history?interval=h1`;
        r = await fetch(url, { cache: 'no-store' });
      }
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const data = Array.isArray(j?.data) ? j.data : [];
      close = data.map((x:any)=> Number(x.priceUsd));
      // pas de volume/H-L fiables
    }

    close = (close || []).filter((n)=>Number.isFinite(n));
    if (close.length < 2) return NextResponse.json({ error: 'No prices' }, { status: 404 });

    // Indicateurs (close-only + H/L/Vol si dispo)
    const indicators:any = {
      ema20: ema(close.slice(-100), 20),
      ema60: ema(close.slice(-300), 60),
      rsi14: rsi(close.slice(-200), 14),
      bollinger: bollinger(close, 20, 2),
      sigma30: std(close.slice(-30)),
      z30: zscore(close, 30),
      sma50: sma(close, 50),
      sma200: sma(close, 200),
      ema200: ema(close, 200),
      atr14: (high && low) ? atrFromHLC(high, low, close, 14) : atrCloseOnly(close, 14),
    };

    const m = macd(close, 12, 26, 9);
    indicators.macd = m.macd;
    indicators.macdSignal = m.signal;
    indicators.macdHist = m.hist;

    if (volume && volume.length === close.length) {
      const typical = (high && low) ? close.map((c,i)=> (high![i]+low![i]+c)/3 ) : close;
      indicators.mfi14 = mfi(typical, volume, 14);
    }

    if (high && low) indicators.stoch14 = stochK(high, low, close, 14);

    return NextResponse.json({ prices: close, indicators, ts: Date.now() });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 500 });
  }
}
