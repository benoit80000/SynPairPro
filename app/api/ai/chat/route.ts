import { NextResponse } from 'next/server';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function extractText(j: any): string {
  const out0 = j?.output?.[0]?.content?.[0]?.text;
  if (typeof out0 === 'string' && out0.trim()) return out0;
  if (typeof j?.output_text === 'string' && j.output_text.trim()) return j.output_text;
  const choiceMsg = j?.choices?.[0]?.message?.content;
  if (typeof choiceMsg === 'string' && choiceMsg.trim()) return choiceMsg;
  const choiceText = j?.choices?.[0]?.text;
  if (typeof choiceText === 'string' && choiceText.trim()) return choiceText;
  return JSON.stringify(j);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || '').slice(0, 4000);
    if (!prompt) return NextResponse.json({ error: 'Empty prompt' }, { status: 400 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: 'Tu es MyAiTraderBot, un assistant de trading crypto. Reste clair, concis, et rappelle la mise en garde: ceci n\'est pas un conseil financier.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    const j = await r.json();
    if (!r.ok) return NextResponse.json({ error: j?.error?.message || 'OpenAI error' }, { status: r.status });
    const text = extractText(j);
    return NextResponse.json({ ok: true, text });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'chat error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Use POST with JSON { prompt }' });
}
