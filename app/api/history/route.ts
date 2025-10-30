import { NextResponse } from 'next/server';
import { ema, rsi, bollinger, std, zscore } from '@/lib/indicators';

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
    let prices: number[] = [];
    if (source === 'binance') {
      const interval = tf;
      const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000);
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(id)}&interval=${interval}&limit=${limit}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      prices = j.map((x: any[]) => Number(x[4])).filter((n:number)=>Number.isFinite(n));
    } else if (source === 'coingecko') {
      const days = searchParams.get('days') || '1';
      const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      prices = (j?.prices || []).map((p: any[]) => Number(p[1])).filter((n:number)=>Number.isFinite(n));
    } else if (source === 'coinpaprika') {
      const end = new Date();
      const start = new Date(Date.now() - 1000 * 60 * 60 * 48);
      const url = `https://api.coinpaprika.com/v1/coins/${encodeURIComponent(id)}/ohlcv/historical?start=${toISODate(start)}&end=${toISODate(end)}`;
      let r = await fetch(url, { cache: 'no-store' });
      let j: any = [];
      if (r.ok) {
        j = await r.json();
        prices = (Array.isArray(j) ? j : []).map((x:any)=> Number(x.close)).filter((n:number)=>Number.isFinite(n));
      }
      if (prices.length < 5) {
        const url2 = `https://api.coinpaprika.com/v1/tickers/${encodeURIComponent(id)}/historical?start=${start.toISOString()}&interval=1h`;
        r = await fetch(url2, { cache: 'no-store' });
        if (r.ok) {
          const jj = await r.json();
          prices = (Array.isArray(jj) ? jj : []).map((x:any)=> Number(x.price)).filter((n:number)=>Number.isFinite(n));
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
      prices = data.map((x:any)=> Number(x.priceUsd)).filter((n:number)=>Number.isFinite(n));
    }

    if (prices.length < 2) return NextResponse.json({ error: 'No prices' }, { status: 404 });
    const indicators = {
      ema20: ema(prices.slice(-100), 20),
      ema60: ema(prices.slice(-300), 60),
      rsi14: rsi(prices.slice(-200), 14),
      bollinger: bollinger(prices, 20, 2),
      sigma30: std(prices.slice(-30)),
      z30: zscore(prices, 30)
    };
    return NextResponse.json({ prices, indicators, ts: Date.now() });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 500 });
  }
}
