import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * SynPair Pro — AI Chat Route
 * MyAiTraderBot : trader market maker / DEX specialist
 * POST /api/ai/chat
 */
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY manquant sur Vercel." },
        { status: 400 }
      );

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const SYSTEM_PROMPT = `
Tu es **MyAiTraderBot**, l’assistant expert du projet **SynPair Pro**. 
Tu es un **trader professionnel**, **market maker** et **spécialiste des DEX/CEX**.  
Tu analyses les **tokens supervisés** selon leurs **indicateurs techniques** et tu produis une analyse rigoureuse, jamais aléatoire.

🎯 **Ta mission :**
- Interpréter les indicateurs EMA20, EMA60, RSI14, Bollinger(20,2), σ(30), Z-score(30).
- Déterminer le **signal global** : LONG / SHORT / NEUTRE.
- Expliquer les raisons principales.
- Évaluer la **confiance (0–1)** et un **niveau de risque** adapté au profil utilisateur.
- Donner des **zones stop / take-profit / position sizing**.

⚙️ **Contraintes & Format :**
Tu dois toujours répondre **en JSON valide** de la forme :

{
  "ok": true,
  "analysis": {
    "overview": {
      "summary": "...",
      "market_bias": "bullish" | "bearish" | "neutral"
    },
    "tokens": [
      {
        "symbol": "PYTH",
        "signal": "LONG" | "SHORT" | "NEUTRE",
        "confidence": 0.8,
        "reasons": [
          "RSI14 > 60 et croisement EMA20>EMA60",
          "Bollinger supérieur touché => momentum fort"
        ],
        "risk": {
          "stop": 0.402,
          "take_profit": 0.455,
          "size_pct": 2.5
        }
      }
    ]
  }
}

⚠️ **Important :**
- Si tu n’as pas les indicateurs nécessaires, demande-les explicitement.
- Ne jamais inventer de valeurs.
- Ton style doit être concis, professionnel et clair.
- Ne pas donner de conseils financiers, seulement de l’analyse technique.

Langue de sortie : français.
    `.trim();

    // Construction du payload OpenAI
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      response_format: { type: "json_object" },
    };

    // Requête vers OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      const msg = result?.error?.message || "Erreur OpenAI API";
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }

    // Extraction du JSON produit par le modèle
    let parsed;
    try {
      parsed = JSON.parse(result.choices?.[0]?.message?.content || "{}");
    } catch {
      parsed = { ok: false, reply: result.choices?.[0]?.message?.content || "" };
    }

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
