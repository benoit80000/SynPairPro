export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY manquant' }, { status: 400 });

  const body = await req.json().catch(()=> ({}));
  const userMessages = Array.isArray(body.messages) ? body.messages : [];

  const MODELS = ['gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  const sys = { role:'system', content: SYSTEM_PROMPT };

  async function call(model:string) {
    const payload = { model, temperature: 0.3, max_tokens: 500, messages: [sys, ...userMessages].slice(-20) };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error?.message || `HTTP ${res.status}`);
    const raw = j?.choices?.[0]?.message?.content || '';
    let parsed:any=null;
    try { parsed = JSON.parse(raw); } catch { /* try a gentle repair */ }
    if (!parsed || typeof parsed !== 'object' || !parsed.tokens) {
      // second chance: ask the model to output valid JSON (quick repair prompt)
      const repair = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 150,// après const j = await res.json();
if (j.ok && j.analysis) {
  const a = j.analysis;
  const header = `🧭 ${a.overview?.summary || 'Synthèse indisponible'}  ·  Bias: ${a.overview?.market_bias || 'neutral'}`;
  setMessages(m => [...m, { role:'assistant', content: header }]);
  (a.tokens || []).forEach((t:any) => {
    const line = [
      `• ${t.symbol} — ${t.signal} (${(t.confidence*100|0)}%)`,
      ...(t.reasons?.slice(0,3) || [])
    ].join('\n');
    setMessages(m => [...m, { role:'assistant', content: line }]);
  });
} else {
  setMessages(m=>[...m, { role:'assistant', content: j.reply || '(réponse vide)' }]);
}

          messages: [
            { role:'system', content: 'Tu es un validateur JSON: renvoie uniquement un JSON valide.' },
            { role:'user', content: `Corrige en JSON strict ce contenu (sans rien ajouter):\n${raw}` }
          ]
        })
      }).then(r=>r.json());
      try { parsed = JSON.parse(repair?.choices?.[0]?.message?.content || ''); } catch {}
    }
    if (!parsed || !parsed.tokens) throw new Error('Invalid JSON from model');
    return parsed;
  }

  let lastErr:any=null;
  for (const m of MODELS) {
    try {
      const out = await call(m);
      return NextResponse.json({ ok:true, model:m, analysis: out });
    } catch (e:any) {
      lastErr = e?.message || String(e);
      continue;
    }
  }
  return NextResponse.json({ ok:false, error: lastErr }, { status: 502 });
}
