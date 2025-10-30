// app/page.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Controls from "@/components/Controls";
import TokenManager from "@/components/TokenManager";
import PairManager from "@/components/PairManager";
import { loadTokens, TokenItem } from "@/lib/tokens";
import { SupervisionState, superviseTokens } from "@/lib/supervision";
import { deriveSignal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Minus, Link as LinkIcon } from "lucide-react";
import { loadIndicators } from "@/lib/settings";

type ViewMode = 'compact'|'detailed';
type SortBy = 'symbol'|'price'|'signal';

function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const s = Math.max(1, Math.floor((Date.now() - ts)/1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s/60); if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m/60); return `il y a ${h}h`;
}

export default function Page() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [state, setState] = useState<SupervisionState>({});
  const [view, setView] = useState<ViewMode>('detailed');
  const [sortBy, setSortBy] = useState<SortBy>('signal');
  const [signalFilter, setSignalFilter] = useState<'all'|'buy'|'sell'|'neutral'>('all');
  const [visibleInds, setVisibleInds] = useState(loadIndicators());
  const stopRef = useRef<{ stop: () => void; setInterval: (ms: number) => void; forceOnce: ()=>void } | null>(null);

  useEffect(() => { setTokens(loadTokens()); }, []);
  useEffect(() => {
    const onRefresh = () => { stopRef.current?.forceOnce?.(); setVisibleInds(loadIndicators()); };
    window.addEventListener('synpair:refresh', onRefresh);
    return () => window.removeEventListener('synpair:refresh', onRefresh);
  }, []);

  useEffect(() => {
    if (!tokens.length) return;
    stopRef.current?.stop?.();
    stopRef.current = superviseTokens(tokens, (s) => setState(s)) as any;
    return () => { stopRef.current?.stop?.(); };
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
      const rank = (s:'buy'|'neutral'|'sell') => s==='buy'?3 : s==='neutral'?2 : 1;
      return rank(b._sig as any) - rank(a._sig as any);
    });
    return sorted;
  }, [state, sortBy, signalFilter]);

  const cols = view==='compact' ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";

  function addAsPair(symbolA: string){
    try{
      const KEY = "synpair_pairs_v1";
      const current = JSON.parse(localStorage.getItem(KEY) || "[]");
      // Crée une paire A/USDT (ou A/ETH) si pas de choix ; ici on prépare juste A/ETH par défaut
      const fallback = { a: symbolA, b: "ETH" };
      const exists = current.some((p:any)=> p.a===fallback.a && p.b===fallback.b);
      const next = exists ? current : [...current, fallback];
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('storage')); // PairManager lit périodiquement localStorage
      alert(`Paire ajoutée: ${fallback.a}/${fallback.b} (modifiable dans la section Paires)`);
    }catch{}
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-extrabold">SynPair Pro</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={()=>stopRef.current?.forceOnce?.()} className="badge">🔄 Rafraîchir maintenant</button>
          <select className="input" value={view} onChange={(e)=>setView(e.target.value as ViewMode)}>
            <option value="detailed">Détaillé</option>
            <option value="compact">Compact</option>
          </select>
          <select className="input" value={sortBy} onChange={(e)=>setSortBy(e.target.value as SortBy)}>
            <option value="signal">Trier par signal</option>
            <option value="price">Trier par prix</option>
            <option value="symbol">Trier par symbole</option>
          </select>
          <select className="input" value={signalFilter} onChange={(e)=>setSignalFilter(e.target.value as any)}>
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

          const inds = r.indicators || {};
          const list = [
            visibleInds.includes('ema20') && inds.ema20!==undefined ? { k:'EMA20', v:inds.ema20 } : null,
            visibleInds.includes('ema60') && inds.ema60!==undefined ? { k:'EMA60', v:inds.ema60 } : null,
            visibleInds.includes('rsi14') && inds.rsi14!==undefined ? { k:'RSI14', v:inds.rsi14 } : null,
            visibleInds.includes('bb') && inds.bollinger ? { k:'BB(20,2)', v:`${inds.bollinger.lower?.toFixed?.(4) ?? '—'} / ${inds.bollinger.mid?.toFixed?.(4) ?? '—'} / ${inds.bollinger.upper?.toFixed?.(4) ?? '—'}` } : null,
            visibleInds.includes('sigma30') && inds.sigma30!==undefined ? { k:'σ30', v:inds.sigma30 } : null,
            visibleInds.includes('z30') && inds.z30!==undefined ? { k:'Z30', v:inds.z30 } : null,
          ].filter(Boolean) as {k:string;v:any}[];

          return (
            <div key={r.symbol} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold">{r.symbol}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">{r.source.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border border-white/10 ${color}`}>
                    <Icon className="inline h-4 w-4 -mt-0.5 mr-1" /> {sig==='buy' ? 'Achat' : sig==='sell' ? 'Vente' : 'Neutre'}
                  </span>
                  <button className="badge" title="Ajouter en paire (A/ETH)" onClick={()=>addAsPair(r.symbol)}><LinkIcon className="inline h-4 w-4 -mt-0.5 mr-1"/>Paired</button>
                </div>
              </div>
              {r.error ? (
                <div className="text-red-500">Erreur: {r.error}</div>
              ) : (
                <>
                  <div className="text-2xl font-mono">{r.price ?? "—"}</div>

                  {/* Indicateurs sélectionnés */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {list.length===0 && <div className="text-white/50 col-span-2">Aucun indicateur sélectionné (voir “Indicateurs visibles” dans les réglages).</div>}
                    {list.map((it, idx)=>(
                      <div key={idx} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-xs opacity-60">{it.k}</div>
                        <div className="font-mono">{typeof it.v === 'number' ? Number(it.v).toFixed(4) : String(it.v)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-1 text-[11px] opacity-50">maj {timeAgo(r.ts)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <PairManager />
      <TokenManager />
    </main>
  );
}
