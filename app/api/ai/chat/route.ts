import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
Tu es MyAiTraderBot, un assistant d’analyse marché crypto (trader/market maker).
Réponds en français, de manière concise et actionnable.
Rôle :
- Lire et interpréter des indicateurs (EMA20, EMA60, RSI14, Bollinger(20,2), σ(30), Z-score(30)).
- Produire : (1) résumé 1–2 phrases, (2) signal {LONG|SHORT|NEUTRE}, (3) 2–4 raisons chiffrées,
  (4) gestion du risque (stop, taille %), (5) remarque d’arbitrage si pertinente.
Contraintes :
- Si données incomplètes → demande ce qu’il manque (ne pas inventer).
- Mentionne la source (Binance/CoinGecko) si fournie.
- Termine par : "⚠ Ceci n’est pas un conseil financier."
Ton : calme, analytique, factuel. Longueur ~250 tokens.
`;

const MODELS = ['gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API OpenAI manquante (OPENAI_API_KEY).' },
      { status: 400 }
    );
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const sys = { role: 'system', content: SYSTEM_PROMPT };

  let lastError: any = null;
  for (const model of MODELS) {
    try {
      const payload = {
        model,
        messages: [sys, ...messages].slice(-20),
        temperature: 0.3,
        max_tokens: 400,
      };

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!res.ok) {
        lastError = { status: res.status, details: j?.error?.message || j };
        continue;
      }

      const reply = j?.choices?.[0]?.message?.content || '';
      return NextResponse.json({ reply, model });
    } catch (e: any) {
      lastError = { status: 500, details: e?.message || String(e) };
      continue;
    }
  }

  return NextResponse.json(
    { error: 'Échec appels OpenAI', cause: lastError },
    { status: lastError?.status || 502 }
  );
}
