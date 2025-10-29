import { NextResponse } from 'next/server';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function fetchJSON(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toUpperCase();
  try {
    const tasks = [
      // Binance
      fetchJSON('https://api.binance.com/api/v3/exchangeInfo').then((j) => {
        const list = (j?.symbols || []).filter((s: any)=>s.status==='TRADING' && s.quoteAsset==='USDT')
          .map((s:any)=>({ source:'binance', symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset }));
        return list;
      }),
      // CoinPaprika (symbols)
      fetchJSON('https://api.coinpaprika.com/v1/tickers').then((arr:any[])=>{
        return arr.slice(0,5000).map((x:any)=>({ source:'coinpaprika', symbol: (x.symbol||'').toUpperCase(), id: x.id }));
      }).catch(()=>[]),
      // CoinCap (assets)
      fetchJSON('https://api.coincap.io/v2/assets?limit=2000').then((j:any)=>{
        return (j?.data||[]).map((x:any)=>({ source:'coincap', symbol: (x.symbol||'').toUpperCase(), id: x.id }));
      }).catch(()=>[]),
    ];
    const [binance, paprika, coincap] = await Promise.all(tasks);
    let combined:any[] = [];
    if (q) {
      const qq = q.toUpperCase();
      combined = [
        ...binance.filter((x:any)=> x.symbol.includes(qq) || x.base.includes(qq)),
        ...paprika.filter((x:any)=> x.symbol.includes(qq)),
        ...coincap.filter((x:any)=> x.symbol.includes(qq)),
      ];
    } else {
      combined = binance.slice(0,100);
    }
    return NextResponse.json({ items: combined.slice(0, 200) });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'search error' }, { status: 500 });
  }
}
