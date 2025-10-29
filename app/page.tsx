"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Controls from "@/components/Controls";
import TokenManager from "@/components/TokenManager";
import PairManager from "@/components/PairManager";
import ChatBot from "@/components/ChatBot";
import { loadTokens, TokenItem } from "@/lib/tokens";
import { SupervisionState, superviseTokens } from "@/lib/supervision";
import { deriveSignal } from "@/lib/indicators";
import { timeAgo } from "@/lib/time";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ViewMode = 'compact'|'detailed';
type SortBy = 'symbol'|'price'|'signal';

export default function Page() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [state, setState] = useState<SupervisionState>({});
  const [view, setView] = useState<ViewMode>('detailed');
  const [sortBy, setSortBy] = useState<SortBy>('signal');
  const [signalFilter, setSignalFilter] = useState<'all'|'buy'|'sell'|'neutral'>('all');
  const stopRef = useRef<{ stop: () => void; setInterval: (ms: number) => void; forceOnce: ()=>void } | null>(null);

  useEffect(() => { setTokens(loadTokens()); }, []);

  useEffect(() => {
    if (!tokens.length) return;
    stopRef.current?.stop?.();
    stopRef.current = superviseTokens(
      tokens.map((t) => ({ symbol: t.symbol, name: t.name, binance_symbol: t.binance_symbol, coingecko_id: t.coingecko_id, coinpaprika_id: t.coinpaprika_id, coincap_id: t.coincap_id })),
      (s) => setState(s)
    ) as any;
    const onRefresh = () => stopRef.current?.forceOnce?.();
    window.addEventListener('synpair:refresh', onRefresh);
    return () => { window.removeEventListener('synpair:refresh', onRefresh); stopRef.current?.stop?.(); };
  }, [tokens]);

  const rows = useMemo(()=>{
    const list = Object.values(state).map(r=>{
      const sig = deriveSignal({
        price: r.price, ema20: r.indicators?.ema20, ema60: r.indicators?.ema60,
        rsi14: r.indicators?.rsi14, bb: r.indicators?.bollinger, z30: r.indicators?.z30,
      });
      return { ...r, _sig: sig };
    });
    const filtered = signalFilter==='all' ? list : list.filter(x=>x._sig===signalFilter);
    const sorted = [...filtered].sort((a,b)=>{
      if (sortBy==='symbol') return a.symbol.localeCompare(b.symbol);
      if (sortBy==='price') return (b.price||0) - (a.price||0);
      // signal: buy > neutral > sell by default
      const rank = (s:'buy'|'neutral'|'sell') => s==='buy'?3 : s==='neutral'?2 : 1;
      return rank(b._sig as any) - rank(a._sig as any);
    });
    return sorted;
  }, [state, sortBy, signalFilter]);

  const cols = view==='compact' ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <main className="min-h-screen p-6 text-white">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-extrabold">SynPair Pro</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={()=>stopRef.current?.forceOnce?.()} className="badge" title="Rafraîchir immédiatement">🔄 Rafraîchir maintenant</button>
          <select className="input" value={view} onChange={(e)=>setView(e.target.value as ViewMode)} title="Densité d'affichage">
            <option value="detailed">Détaillé</option>
            <option value="compact">Compact</option>
          </select>
          <select className="input" value={sortBy} onChange={(e)=>setSortBy(e.target.value as SortBy)} title="Tri">
            <option value="signal">Trier par signal</option>
            <option value="price">Trier par prix</option>
            <option value="symbol">Trier par symbole</option>
          </select>
          <select className="input" value={signalFilter} onChange={(e)=>setSignalFilter(e.target.value as any)} title="Filtrer par signal">
            <option value="all">Tous</option>
            <option value="buy">Achat</option>
            <option value="neutral">Neutre</option>
            <option value="sell">Vente</option>
          </select>
        </div>
      </div>

      <Controls onChange={({ intervalMs }) => { stopRef.current?.setInterval(intervalMs); }} />

      <div className={`grid gap-4 ${cols}`}>
        {rows.map((r) => {
          const sig = r._sig as ('buy'|'neutral'|'sell');
          const color = sig==='buy' ? 'bg-bull/20 text-bull' : sig==='sell' ? 'bg-bear/20 text-bear' : 'bg-neutral/20 text-neutral';
          const Icon = sig==='buy' ? TrendingUp : sig==='sell' ? TrendingDown : Minus;
          return (
            <div key={r.symbol} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold">{r.symbol}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">{r.source.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border border-white/10 ${color}`} title="Signal agrégé basé sur RSI/EMA/BB/Z-score">
                    <Icon className="inline h-4 w-4 -mt-0.5 mr-1" /> {sig==='buy' ? 'Achat' : sig==='sell' ? 'Vente' : 'Neutre'}
                  </span>
                </div>
              </div>
              {r.error ? (
                <div className="text-red-400">Erreur: {r.error}</div>
              ) : (
                <>
                  <div className="text-2xl font-mono">{r.price ?? "—"}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="badge" title="Indice de force relative (14)">RSI14: {r.indicators?.rsi14?.toFixed(1) ?? "—"}</div>
                    <div className="badge" title="Moyenne mobile exponentielle (20)">EMA20: {r.indicators?.ema20?.toFixed(4) ?? "—"}</div>
                    <div className="badge" title="Moyenne mobile exponentielle (60)">EMA60: {r.indicators?.ema60?.toFixed(4) ?? "—"}</div>
                    <div className="badge" title="Écart-type sur 30">σ30: {r.indicators?.sigma30?.toFixed(6) ?? "—"}</div>
                  </div>
                  <div className="mt-2 text-xs text-white/60" title="Bandes de Bollinger (20,2)">
                    BB mid: {r.indicators?.bollinger?.mid?.toFixed(4) ?? "—"} · up: {r.indicators?.bollinger?.upper?.toFixed(4) ?? "—"} · low: {r.indicators?.bollinger?.lower?.toFixed(4) ?? "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-white/40">maj {timeAgo(r.ts)}</div>
                </>
              )}
            </div>
          );
        })}
        {rows.length === 0 && tokens.length>0 && (
          <>
            <div className="card"><div className="skeleton skeleton-lg mb-2"></div><div className="skeleton mb-2"></div><div className="skeleton"></div></div>
            <div className="card"><div className="skeleton skeleton-lg mb-2"></div><div className="skeleton mb-2"></div><div className="skeleton"></div></div>
            <div className="card"><div className="skeleton skeleton-lg mb-2"></div><div className="skeleton mb-2"></div><div className="skeleton"></div></div>
          </>
        )}
        {tokens.length===0 && <div className="text-white/60">Ajoute des tokens pour démarrer la supervision.</div>}
      </div>

      <PairManager />
      <TokenManager />
      <ChatBot />
    </main>
  );
}
