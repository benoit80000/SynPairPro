import { NextResponse } from 'next/server';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok:false, error:'OPENAI_API_KEY manquant' }, { status:400 });

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role:'system', content:'Ping' }, { role:'user', content:'Réponds "pong".' }],
        max_tokens: 5,
        temperature: 0
      })
    });
    const j = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok:false, status:res.status, error:j?.error?.message || j }, { status: res.status });
    }
    const reply = j?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ ok:true, reply });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || String(e) }, { status: 500 });
  }
}
