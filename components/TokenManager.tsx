"use client";
import React, { useEffect, useRef, useState } from "react";
import { loadTokens, saveTokens, resetTokens, TokenItem } from "@/lib/tokens";

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

  const [form, setForm] = useState<TokenItem>({ symbol: "", name: "", binance_symbol: "" });

  function pickSuggestion(s: SearchItem){
    if (s.source==='binance' && s.symbol && s.base) {
      setForm({ symbol: s.base, name: s.base, binance_symbol: s.symbol });
    } else if (s.source==='coinpaprika' && s.id && s.symbol) {
      setForm({ symbol: s.symbol, name: s.symbol, binance_symbol: `${s.symbol}USDT`, coinpaprika_id: s.id });
    } else if (s.source==='coincap' && s.id && s.symbol) {
      setForm({ symbol: s.symbol, name: s.symbol, binance_symbol: `${s.symbol}USDT`, coincap_id: s.id });
    } else {
      setForm({ symbol: s.symbol || "", name: s.symbol || "", binance_symbol: (s.symbol || '') + 'USDT' });
    }
  }

  function handleAdd() {
    if (!form.binance_symbol) return alert("Sélectionne ou saisis un symbole Binance (…USDT).");
    const newList = [...tokens.filter(t => t.binance_symbol !== form.binance_symbol), { ...form, symbol: form.symbol.toUpperCase() }]
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    setTokens(newList); saveTokens(newList);
    setForm({ symbol: "", name: "", binance_symbol: "" }); setQ("");
    window.dispatchEvent(new CustomEvent('synpair:refresh'));
  }

  function handleDelete(binance_symbol: string) { const newList = tokens.filter(t => t.binance_symbol !== binance_symbol); setTokens(newList); saveTokens(newList); }
  function handleReset() { resetTokens(); setTokens(loadTokens()); window.dispatchEvent(new CustomEvent('synpair:refresh')); }

  function exportTokens() {
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tokens.json'; a.click(); URL.revokeObjectURL(url);
  }
  function exportState() {
    const state = (window as any).__synpair__?.tokens || {};
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'analysis-state.json'; a.click(); URL.revokeObjectURL(url);
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
        <input className="input font-mono" placeholder="Binance (ex: LINKUSDT)" value={form.binance_symbol} onChange={e=>setForm({...form, binance_symbol:e.target.value.toUpperCase()})}/>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={handleAdd} className="button" title="Ajoute le token à la liste de supervision">➕ Ajouter</button>
        <button onClick={()=>window.dispatchEvent(new CustomEvent('synpair:refresh'))} className="badge" title="Force un rafraîchissement immédiat">🔄 Rafraîchir</button>
        <button onClick={handleReset} className="badge" title="Revenir aux tokens par défaut">🧹 Réinitialiser</button>
        <button onClick={exportTokens} className="badge" title="Exporter la liste au format JSON">⬇️ Export tokens</button>
        <button onClick={exportState} className="badge" title="Exporter l'état courant des analyses">⬇️ Export analyses</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e)=>{ const f=e.target.files?.[0]; if(f) importTokens(f); (e.target as any).value=''; }} />
        <button onClick={()=>fileRef.current?.click()} className="badge" title="Importer une liste JSON">⬆️ Import tokens</button>
      </div>
    </div>
  );
}
