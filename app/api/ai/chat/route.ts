import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
Tu es MyAiTraderBot, un assistant d’analyse marché crypto (trader/market maker).
Réponds en français, de manière concise et actionnable.
Rôle :
- Lire et interpréter des indicateurs (EMA20, EMA60, RSI14, Bollinger(20,2), σ(30), Z-score(30)).
- Produire :
  1. Un résumé court (1–2 phrases)
  2. Un signal {LONG|SHORT|NEUTRE}
  3. 2–4 raisons chiffrées basées sur les indicateurs
  4. Une suggestion de gestion du risque (stop, taille %)
  5. Une remarque éventuelle sur l’arbitrage inter-exchange.
Contraintes :
- Si les données sont incomplètes, demande ce qu’il manque sans inventer.
- Mentionne la source (Binance / CoinGecko) si donnée.
- Termine toujours par : "⚠ Ceci n’est pas un conseil financier."
Ton : calme, analytique, factuel. Longueur max ~250 tokens.
`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API OpenAI manquante. Configure OPENAI_API_KEY sur Vercel.' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const sys = { role: 'system', content: SYSTEM_PROMPT };

    const payload = {
      model: 'gpt-4-turbo', // tu peux mettre gpt-3.5-turbo si besoin
      messages: [sys, ...messages].slice(-20),
      temperature: 0.3,
      max_tokens: 400,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const j = await res.json();

    if (!res.ok) {
      console.error('Erreur OpenAI:', j);
      return NextResponse.json(
        { error: j.error?.message || 'Erreur API OpenAI.' },
        { status: res.status }
      );
    }

    const reply = j.choices?.[0]?.message?.content || '(Réponse vide)';
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error('Erreur serveur:', e);
    return NextResponse.json(
      { error: 'Erreur interne du serveur AI: ' + e.message },
      { status: 500 }
    );
  }
}
