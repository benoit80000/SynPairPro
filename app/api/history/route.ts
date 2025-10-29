// app/api/history/route.ts
import { NextResponse } from 'next/server';
import { computeAll } from '@/lib/indicators';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/history?source=binance&id=PYTHUSDT&interval=1m&limit=120
 * GET /api/history?source=coingecko&id=pyth-network&days=1
 * Returns { prices: number[], indicators: {...}, ts: number }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = (searchParams.get('source') || 'binance') as 'binance'|'coingecko';
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    let prices: number[] = [];

    if (source === 'binance') {
      const interval = searchParams.get('interval') || '1m';
      const limit = Math.min(Number(searchParams.get('limit') || '180'), 1000);
      const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(id)}&interval=${interval}&limit=${limit}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      prices = j.map((x: any[]) => Number(x[4])).filter((n:number)=>Number.isFinite(n)); // close
    } else {
      // CoinGecko: market_chart returns prices [ [ts, price], ... ]
      const days = searchParams.get('days') || '1';
      const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      prices = (j?.prices || []).map((p: any[]) => Number(p[1])).filter((n:number)=>Number.isFinite(n));
    }

    if (prices.length < 2) return NextResponse.json({ error: 'No prices' }, { status: 404 });
    const indicators = computeAll(prices);
    return NextResponse.json({ prices, indicators, ts: Date.now() });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 500 });
  }
}
