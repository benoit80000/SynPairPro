import { NextResponse } from "next/server";
export const runtime = "edge";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "OPENAI_API_KEY manquant sur Vercel." }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const SYSTEM_PROMPT = `Tu es MyAiTraderBot, un trader expert en DEX/CEX.
Tu analyses EMA20, EMA60, RSI14, Bollinger(20,2), sigma(30), Z-score(30).
Ne donne pas de conseil financier. Réponds en JSON valide :
{
  "ok": true,
  "analysis": {
    "overview": { "summary": "...", "market_bias": "bullish|bearish|neutral" },
    "tokens": [
      {
        "symbol": "LINK",
        "signal": "LONG|SHORT|NEUTRE",
        "confidence": 0.7,
        "reasons": ["...","..."],
        "risk": { "stop": 0.0, "take_profit": 0.0, "size_pct": 2.5 }
      }
    ]
  }
}`.trim();
    const payload = { model: "gpt-4o-mini", temperature: 0.35, max_tokens: 800, response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages] };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      const msg = result?.error?.message || "Erreur OpenAI API";
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
    let parsed;
    try { parsed = JSON.parse(result.choices?.[0]?.message?.content || "{}"); }
    catch { parsed = { ok: false, reply: result.choices?.[0]?.message?.content || "" }; }
    return NextResponse.json(parsed);
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erreur interne serveur" }, { status: 500 });
  }
}