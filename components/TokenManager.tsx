"use client";
import React, { useEffect, useMemo, useState } from "react";
import { loadTokens, saveTokens, resetTokens, TokenItem } from "@/lib/tokens";
type ExSymbol = { symbol: string; baseAsset: string; quoteAsset: string };
export default function TokenManager() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [allSymbols, setAllSymbols] = useState<ExSymbol[]>([]);
  const [q, setQ] = useState(""); 
  const [form, setForm] = useState<TokenItem>({ symbol: "", name: "", binance_symbol: "" });
  useEffect(() => { setTokens(loadTokens()); }, []);
  useEffect(() => { (async () => { try { const r = await fetch("/api/binance/symbols"); const j = await r.json(); if (Array.isArray(j?.symbols)) setAllSymbols(j.symbols); } catch {} })(); }, []);
  const suggestions = useMemo(() => {
    const s = q.trim().toUpperCase(); if (!s) return allSymbols.slice(0, 30);
    return allSymbols.filter(x => x.symbol.includes(s) || x.baseAsset.includes(s) || (x.baseAsset + "USDT").includes(s)).slice(0, 30);
  }, [q, allSymbols]);
  function autofillFrom(ex: ExSymbol) { setForm({ symbol: ex.baseAsset, name: ex.baseAsset, binance_symbol: ex.symbol }); setQ(ex.symbol); }
  function handleAdd() {
    if (!form.binance_symbol) return alert("Sélectionne un symbole Binance valide (…USDT).");
    const exists = allSymbols.find(x => x.symbol === form.binance_symbol);
    if (!exists) return alert("Symbole Binance introuvable.");
    const newList = [...tokens.filter(t => t.binance_symbol !== form.binance_symbol), form].sort((a, b) => a.symbol.localeCompare(b.symbol));
    setTokens(newList); saveTokens(newList); setForm({ symbol: "", name: "", binance_symbol: "" }); setQ("");
  }
  function handleDelete(binance_symbol: string) { const newList = tokens.filter(t => t.binance_symbol !== binance_symbol); setTokens(newList); saveTokens(newList); }
  function handleReset() { resetTokens(); setTokens(loadTokens()); }
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="mb-2 text-2xl font-bold">⚙️ Gestion des Tokens (Binance)</h2>
      <div className="mb-3">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher (ex: LINK, LINKUSDT, SOL…)" className="input w-full"/>
        <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-white/10 bg-black/30">
          {suggestions.map(s=> (
            <button key={s.symbol} onClick={()=>autofillFrom(s)} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/10">
              <span className="font-mono">{s.symbol}</span>
              <span className="text-xs text-white/60">{s.baseAsset}/{s.quoteAsset}</span>
            </button>
          ))}
          {suggestions.length===0 && <div className="px-3 py-2 text-sm text-white/60">Aucune correspondance…</div>}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <input className="input" placeholder="Symbole (ex: LINK)" value={form.symbol} onChange={e=>setForm({...form, symbol:e.target.value.toUpperCase()})}/>
        <input className="input" placeholder="Nom (ex: Chainlink)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="input font-mono" placeholder="Binance (ex: LINKUSDT)" value={form.binance_symbol} onChange={e=>setForm({...form, binance_symbol:e.target.value.toUpperCase()})}/>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={handleAdd} className="button">➕ Ajouter</button>
        <button onClick={handleReset} className="badge">🔄 Réinitialiser</button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-white/70">
            <tr><th className="px-3 py-2">Symbole</th><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Binance</th><th className="px-3 py-2 text-center">Actions</th></tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.binance_symbol} className="border-t border-white/10">
                <td className="px-3 py-2">{t.symbol}</td>
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2 font-mono">{t.binance_symbol}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={()=>handleDelete(t.binance_symbol)} className="rounded-full bg-red-600/80 px-3 py-1 text-white hover:bg-red-600">🗑️ Supprimer</button>
                </td>
              </tr>
            ))}
            {tokens.length===0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-white/60">Aucun token. Ajoute une paire ci-dessus.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}