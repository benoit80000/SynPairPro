import { NextResponse } from 'next/server';
export const runtime = 'edge';

async function time<T>(fn:()=>Promise<T>): Promise<{ms:number, ok:boolean, error?:string}>{
  const t0 = Date.now();
  try{ await fn(); return { ms: Date.now()-t0, ok: true }; }
  catch(e:any){ return { ms: Date.now()-t0, ok: false, error: e?.message || 'error' }; }
}

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const tokens = Number(searchParams.get('tokens') || '0');

  const coingeckoKey = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  const binance = await time(async ()=>{
    const r = await fetch('https://api.binance.com/api/v3/ping', { cache:'no-store' });
    if (!r.ok) throw new Error('status '+r.status);
    await r.arrayBuffer();
  });

  const coingecko = await time(async ()=>{
    const headers: Record<string,string> = { accept:'application/json' };
    if (coingeckoKey) headers['x-cg-pro-api-key'] = coingeckoKey;
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usdt', { cache:'no-store', headers });
    if (!r.ok) throw new Error('status '+r.status);
    await r.json();
  });

  let openai: {ms:number, ok:boolean, error?:string} | null = null;
  if (openaiKey){
    openai = await time(async ()=>{
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'content-type':'application/json', 'authorization':`Bearer ${openaiKey}` },
        body: JSON.stringify({ model:'gpt-4-turbo', messages:[{role:'system',content:'ping'}], max_tokens: 1, temperature: 0 })
      });
      if (!r.ok) throw new Error('status '+r.status);
      await r.json();
    });
    if (openai && !openai.ok){
      // fallback quick check
      const fb = await time(async ()=>{
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method:'POST',
          headers:{ 'content-type':'application/json', 'authorization':`Bearer ${openaiKey}` },
          body: JSON.stringify({ model:'gpt-3.5-turbo', messages:[{role:'system',content:'ping'}], max_tokens: 1, temperature: 0 })
        });
        if (!r.ok) throw new Error('status '+r.status);
        await r.json();
      });
      openai = fb;
    }
  }

  const out = {
    timestamp: Date.now(),
    binance_latency_ms: binance.ms,
    binance_ok: binance.ok,
    coingecko_latency_ms: coingecko.ms,
    coingecko_ok: coingecko.ok,
    openai_latency_ms: openai ? openai.ms : null,
    openai_ok: openai ? openai.ok : null,
    tokens_monitored: Number.isFinite(tokens) ? tokens : 0
  };
  return NextResponse.json(out, { headers: { 'cache-control':'no-store' } });
}
