"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Controls from "@/components/Controls";
import TokenManager from "@/components/TokenManager";
import PairManager from "@/components/PairManager";
import { loadTokens, TokenItem } from "@/lib/tokens";
import { SupervisionState, superviseTokens } from "@/lib/supervision";
import { deriveSignal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Minus, Link as LinkIcon, RefreshCw } from "lucide-react";
import { loadIndicators } from "@/lib/settings";

type ViewMode = "compact" | "detailed";
type SortBy = "symbol" | "price" | "signal";

function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  return `il y a ${h}h`;
}

export default function Page() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [state, setState] = useState<SupervisionState>({});
  const [view, setView] = useState<ViewMode>("detailed");
  const [sortBy, setSortBy] = useState<SortBy>("signal");
  const [signalFilter, setSignalFilter] = useState<"all" | "buy" | "sell" | "neutral">("all");
  const [visibleInds, setVisibleInds] = useState(loadIndicators());
  const [showAssistant, setShowAssistant] = useState(false);
  const supRef = useRef<{ stop: () => void; setInterval: (ms: number) => void; forceOnce: () => void } | null>(null);

  useEffect(() => setTokens(loadTokens()), []);

  useEffect(() => {
    const onRefresh = () => {
      supRef.current?.forceOnce?.();
      setVisibleInds(loadIndicators());
    };
    window.addEventListener("synpair:refresh", onRefresh);
    return () => window.removeEventListener("synpair:refresh", onRefresh);
  }, []);

  useEffect(() => {
    if (!tokens.length) return;
    supRef.current?.stop?.();
    supRef.current = superviseTokens(tokens, (s) => setState(s)) as any;
    return () => supRef.current?.stop?.();
  }, [tokens]);

  const rows = useMemo(() => {
    const list = Object.values(state).map((r) => {
      const bb = r.indicators?.bollinger ?? undefined;
      const sig = deriveSignal({
        price: r.price,
        ema20: r.indicators?.ema20,
        ema60: r.indicators?.ema60,
        rsi14: r.indicators?.rsi14,
        bb,
        z30: r.indicators?.z30,
      });
      return { ...r, _sig: sig };
    });

    const filtered = signalFilter === "all" ? list : list.filter((x) => x._sig === signalFilter);
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return (b.price || 0) - (a.price || 0);
      const rank = (s: "buy" | "neutral" | "sell") => (s === "buy" ? 3 : s === "neutral" ? 2 : 1);
      return rank(b._sig as any) - rank(a._sig as any);
    });
    return sorted;
  }, [state, sortBy, signalFilter]);

  const cols = view === "compact" ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";

  function addAsPair(symbolA: string) {
    try {
      const KEY = "synpair_pairs_v1";
      const current = JSON.parse(localStorage.getItem(KEY) || "[]");
      const fallback = { a: symbolA.toUpperCase(), b: "ETH" };
      const exists = current.some((p: any) => p.a === fallback.a && p.b === fallback.b);
      const next = exists ? current : [...current, fallback];
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("synpair:refresh"));
      alert(`Paire ajoutée: ${fallback.a}/${fallback.b}`);
    } catch {}
  }

  const triggerRefresh = () => {
    supRef.current?.forceOnce?.();
    window.dispatchEvent(new CustomEvent("synpair:refresh"));
  };

  return (
    <main className="min-h-screen p-6">
      <style jsx global>{`
        input[type="checkbox"] {
          accent-color: #3b82f6;
          filter: brightness(1.4);
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-extrabold">SynPair Pro</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={triggerRefresh} className="badge" title="Forcer un cycle de rafraîchissement maintenant">
            🔄 Rafraîchir maintenant
          </button>
          <Link href="/help" className="badge" title="Voir la documentation">
            ❓ Aide
          </Link>
          <button onClick={() => setShowAssistant((v) => !v)} className="badge">
            🤖 Bot IA
          </button>
          <select className="input" value={view} onChange={(e) => setView(e.target.value as ViewMode)}>
            <option value="detailed">Détaillé</option>
            <option value="compact">Compact</option>
          </select>
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="signal">Trier par signal</option>
            <option value="price">Trier par prix</option>
            <option value="symbol">Trier par symbole</option>
          </select>
          <select className="input" value={signalFilter} onChange={(e) => setSignalFilter(e.target.value as any)}>
            <option value="all">Tous</option>
            <option value="buy">Achat</option>
            <option value="neutral">Neutre</option>
            <option value="sell">Vente</option>
          </select>
        </div>
      </div>

      {showAssistant && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[420px] max-w-[95vw] max-h-[75vh] rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-white">Assistant IA</h2>
            <button className="badge" onClick={() => setShowAssistant(false)}>
              ✖
            </button>
          </div>
          <div className="text-sm text-white/80 overflow-y-auto max-h-[65vh]">
            Branche ici ton composant ou une iframe de chat IA.
          </div>
        </div>
      )}

      <Controls onChange={({ intervalMs }) => supRef.current?.setInterval(intervalMs)} />

      <div className={`grid gap-4 ${cols}`}>
        {rows.map((r) => {
          const sig = r._sig as "buy" | "neutral" | "sell";
          const color =
            sig === "buy" ? "bg-bull/20 text-bull" : sig === "sell" ? "bg-bear/20 text-bear" : "bg-neutral/20 text-neutral";
          const Icon = sig === "buy" ? TrendingUp : sig === "sell" ? TrendingDown : Minus;
          const inds = r.indicators || {};
          const list = [
            visibleInds.includes("ema20") && inds.ema20 !== undefined ? { k: "EMA20", v: inds.ema20 } : null,
          ].filter(Boolean) as { k: string; v: any }[];

          return (
            <div key={r.symbol} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold">{r.symbol}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">{r.source.toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border border-white/10 ${color}`}>
                    <Icon className="inline h-4 w-4 -mt-0.5 mr-1" /> {sig}
                  </span>
                  <button className="badge" onClick={() => addAsPair(r.symbol)}>
                    <LinkIcon className="inline h-4 w-4 -mt-0.5 mr-1" />
                    Paired
                  </button>
                  <button className="badge" onClick={triggerRefresh}>
                    <RefreshCw className="inline h-4 w-4 -mt-0.5 mr-1" />
                    Rafraîchir
                  </button>
                </div>
              </div>
              <div className="text-2xl font-mono">{r.price ?? "—"}</div>
            </div>
          );
        })}
      </div>

      <PairManager />
      <TokenManager />
    </main>
  );
}
