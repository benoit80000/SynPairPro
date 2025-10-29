import { NextResponse } from 'next/server';
export const runtime = 'edge';

const MODELS = ['gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'];

export async function POST(req: Request){
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if(!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 400 });
  const body = await req.json().catch(()=>({messages:[]}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const sys = { role:'system', content: 'Tu es MyAiTraderBot, un expert trader/market maker. Réponds en français, ton calme et analytique, utile pour la prise de décision. Donne des lectures des indicateurs (EMA, RSI, Bollinger) de manière courte et exploitable.' };
  for (const model of MODELS){
    try{
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'content-type':'application/json', 'authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [sys, ...messages].slice(-20), temperature: 0.3 })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || 'OpenAI error');
      const reply = j?.choices?.[0]?.message?.content || '';
      return NextResponse.json({ reply, model });
    }catch(e){ /* try next */ }
  }
  return NextResponse.json({ error: 'All OpenAI models failed' }, { status: 502 });
}
