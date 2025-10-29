import { NextResponse } from 'next/server';
export const runtime = 'edge';

type CacheEntry = { ts: number; price: number };
const g: any = globalThis as any;
g.__PRICES__ = g.__PRICES__ || new Map<string, CacheEntry>();

async function fetchBinance(symbol: string): Promise<number>{
  const s = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(s)}`, { cache:'no-store' });
  if(!res.ok) throw new Error('Binance ' + res.status);
  const j = await res.json() as { price: string };
  const n = Number(j.price); if(!Number.isFinite(n)) throw new Error('NaN');
  return n;
}
async function fetchCoingecko(id: string): Promise<number>{
  const key = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  const headers: Record<string,string> = { accept:'application/json' };
  if (key) headers['x-cg-pro-api-key'] = key;
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usdt`;
  const res = await fetch(url, { cache:'no-store', headers });
  if(!res.ok) throw new Error('CoinGecko ' + res.status);
  const j = await res.json() as Record<string, { usdt?: number, usd?: number }>;
  const v = j?.[id]?.usdt ?? j?.[id]?.usd; const n = Number(v); if(!Number.isFinite(n)) throw new Error('NaN');
  return n;
}

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const source = (searchParams.get('source') || 'binance').toLowerCase() as 'binance'|'coingecko';
  const id = (searchParams.get('id') || '').trim();
  if(!id) return NextResponse.json({ error:'Missing id' }, { status: 400 });

  const key = `${source}:${id}`;
  const now = Date.now();
  const cache = g.__PRICES__ as Map<string, CacheEntry>;
  const hit = cache.get(key);
  const ttl = source==='binance' ? 10_000 : 15_000;
  if (hit && (now - hit.ts) < ttl) {
    return NextResponse.json({ source, id, price: hit.price, ts: hit.ts, cached: true });
  }
  try{
    const price = source==='binance' ? await fetchBinance(id) : await fetchCoingecko(id);
    cache.set(key, { ts: now, price });
    return NextResponse.json({ source, id, price, ts: now, cached: false });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'fetch error' }, { status: 502 });
  }
}
