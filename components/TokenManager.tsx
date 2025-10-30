// components/TokenManager.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { loadTokens, saveTokens, resetTokens, TokenItem, Source } from "@/lib/tokens";

type SearchItem = { source:string; symbol?:string; base?:string; quote?:string; id?:string };

export default function TokenManager() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const fileRef = useRef<HTMLInputElement|null>(null);

  useEffect(() => { setTokens(loadTokens()); }, []);
  useEffect(() => { (async () => {
    try {
      const r = await fetch(`/api/search/tokens?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (Array.isArray(j?.items)) setItems(j.items);
    } catch {}
  })(); }, [q]);

  const [form, setForm] = useState<TokenItem>({ symbol: "", name: "", source:"binance", binance_symbol: "" });

  function pickSuggestion(s: SearchItem){
    if (s.source==='binance' && s.symbol && s.base) {
      setForm({ symbol: s.base, name: s.base, source:'binance', binance_symbol: s.symbol });
    } else if (s.source==='coinpaprika' && s.id && s.symbol) {
      setForm({ symbol: s.symbol, name: s.symbol, source:'coinpaprika', coinpaprika_id: s.id, binance_symbol: `${s.symbol}USDT` });
    } else if (s.source==='coincap' && s.id && s.symbol) {
      setForm({ symbol: s.symbol, name: s.symbol, source:'coincap', coincap_id: s.id, binance_symbol: `${s.symbol}USDT` });
    } else {
      setForm({ symbol: s.symbol || "", name: s.symbol || "", source:"binance", binance_symbol: (s.symbol || '') + 'USDT' });
    }
  }

  function handleAdd() {
    if (!form.symbol || !form.name || !form.source) return alert("Remplis symbole, nom et source.");
    const sym = form.symbol.toUpperCase();
    const next: TokenItem = { ...form, symbol: sym };

    // Tolérance : si Binance et pas de binance_symbol, on tente SYMUSDT
    if (next.source==='binance' && !next.binance_symbol) next.binance_symbol = `${sym}USDT`;

    if (next.source==='coingecko' && !next.coingecko_id) return alert("Renseigne l’ID CoinGecko.");
    if (next.source==='coinpaprika' && !next.coinpaprika_id) return alert("Renseigne l’ID CoinPaprika.");
    if (next.source==='coincap' && !next.coincap_id) return alert("Renseigne l’ID CoinCap.");

    const list = [...tokens.filter(t => t.symbol.toUpperCase() !== sym), next]
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    setTokens(list); saveTokens(list);
    setForm({ symbol: "", name: "", source:"binance", binance_symbol: "" }); setQ("");
    window.dispatchEvent(new CustomEvent('synpair:refresh'));
  }

  function handleDelete(symbol: string) {
    const list = tokens.filter(t => t.symbol !== symbol);
    setTokens(list); saveTokens(list);
    window.dispatchEvent(new CustomEvent('synpair:refresh'));
  }

  function exportTokens() {
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tokens.json'; a.click(); URL.revokeObjectURL(url);
  }
  function importTokens(file: File){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const json = JSON.parse(String(reader.result||'[]'));
        if (!Array.isArray(json)) throw new Error('Format invalide');
        saveTokens(json); setTokens(loadTokens());
        window.dispatchEvent(new CustomEvent('synpair:refresh'));
      }catch(e:any){ alert('Import échoué: '+(e?.message||'Erreur')); }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="mb-2 text-2xl font-bold">⚙️ Gestion des Tokens</h2>

      <div className="mb-3">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher (Binance + CoinPaprika + CoinCap)…" className="input w-full"/>
        <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-white/10 bg-black/30">
          {items.map((s, i)=> (
            <button key={i} onClick={()=>pickSuggestion(s)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/10">
              <span className="font-mono">{s.symbol || s.base}</span>
              <span className="text-xs text-white/60">{s.source}{s.base?` ${s.base}/USDT`:''}</span>
            </button>
          ))}
          {items.length===0 && <div className="px-3 py-2 text-sm text-white/60">Aucune correspondance…</div>}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input className="input" placeholder="Symbole (ex: LINK)" value={form.symbol} onChange={e=>setForm({...form, symbol:e.target.value.toUpperCase()})}/>
        <input className="input" placeholder="Nom (ex: Chainlink)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <select className="input" value={form.source} onChange={(e)=>setForm({...form, source:e.target.value as Source})}>
          <option value="binance">Binance</option>
          <option value="coingecko">CoinGecko</option>
          <option value="coinpaprika">CoinPaprika</option>
          <option value="coincap">CoinCap</option>
        </select>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-4">
        <input className="input font-mono" placeholder="Binance ex: LINKUSDT" value={form.binance_symbol||''} onChange={e=>setForm({...form, binance_symbol:e.target.value.toUpperCase()})}/>
        <input className="input" placeholder="CoinGecko id ex: chainlink" value={form.coingecko_id||''} onChange={e=>setForm({...form, coingecko_id:e.target.value})}/>
        <input className="input" placeholder="CoinPaprika id ex: link-chainlink" value={form.coinpaprika_id||''} onChange={e=>setForm({...form, coinpaprika_id:e.target.value})}/>
        <input className="input" placeholder="CoinCap id ex: chainlink" value={form.coincap_id||''} onChange={e=>setForm({...form, coincap_id:e.target.value})}/>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={handleAdd} className="button">➕ Ajouter</button>
        <button onClick={()=>window.dispatchEvent(new CustomEvent('synpair:refresh'))} className="badge">🔄 Rafraîchir</button>
        <button onClick={()=>{ resetTokens(); setTokens(loadTokens()); window.dispatchEvent(new CustomEvent('synpair:refresh')); }} className="badge">🧹 Réinitialiser</button>
        <button onClick={exportTokens} className="badge">⬇️ Export tokens</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e)=>{ const f=e.target.files?.[0]; if(f) importTokens(f); (e.target as any).value=''; }} />
        <button onClick={()=>fileRef.current?.click()} className="badge">⬆️ Import tokens</button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {tokens.map(t=> (
          <div key={t.symbol} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2">
            <div>
              <div className="font-bold">{t.symbol}</div>
              <div className="text-xs text-white/60">{t.name} · source: {t.source?.toUpperCase()}</div>
            </div>
            <button onClick={()=>handleDelete(t.symbol)} className="badge" title="Supprimer">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
