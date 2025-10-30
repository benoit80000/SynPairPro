// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Controls from "@/components/Controls";
import TokenManager from "@/components/TokenManager";
import PairManager from "@/components/PairManager";
import { loadTokens, TokenItem } from "@/lib/tokens";
import { SupervisionState, superviseTokens } from "@/lib/supervision";
import { deriveSignal } from "@/lib/indicators";
import { TrendingUp, TrendingDown, Minus, Link as LinkIcon } from "lucide-react";
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
  const supRef = useRef<{ stop: () => void; setInterval: (ms: number) => void; forceOnce: () => void } | null>(null);

  // Charge les tokens sauvegardés
  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  // Écoute les refresh déclenchés par Controls / TokenManager / PairManager
  useEffect(() => {
    const onRefresh = () => {
      supRef.current?.forceOnce?.();
      setVisibleInds(loadIndicators());
    };
    window.addEventListener("synpair:refresh", onRefresh);
    return () => window.removeEventListener("synpair:refresh", onRefresh);
  }, []);

  // Lance la supervision quand la liste de tokens change
  useEffect(() => {
    if (!tokens.length) return;
    supRef.current?.stop?.();
    supRef.current = superviseTokens(tokens, (s) => setState(s)) as any;
    return () => {
      supRef.current?.stop?.();
    };
  }, [tokens]);

  // Prépare les lignes avec le signal dérivé
  const rows = useMemo(() => {
    const list = Object.values(state).map((r) => {
      const bb = r.indicators?.bollinger ?? undefined; // normalise null -> undefined
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

    const filtered =
      signalFilter === "all" ? list : list.filter((x) => x._sig === signalFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "price") return (b.price || 0) - (a.price || 0);
      // Tri par "force" du signal
      const rank = (s: "buy" | "neutral" | "sell") =>
        s === "buy" ? 3 : s === "neutral" ? 2 : 1;
      return rank(b._sig as any) - rank(a._sig as any);
    });

    return sorted;
  }, [state, sortBy, signalFilter]);

  const cols =
    view === "compact" ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3";

  // Ajout rapide d’une paire depuis une tuile token (A/ETH par défaut)
  function addAsPair(symbolA: string) {
    try {
      const KEY = "synpair_pairs_v1";
      const current = JSON.parse(localStorage.getItem(KEY) || "[]");
      const fallback = { a: symbolA.toUpperCase(), b: "ETH" };
      const exists = current.some((p: any) => p.a === fallback.a && p.b === fallback.b);
      const next = exists ? current : [...current, fallback];
      localStorage.setItem(KEY, JSON.stringify(next));
      // On conserve l'event "storage" comme dans l'implémentation existante
      window.dispatchEvent(new Event("storage"));
      alert(
        `Paire ajoutée: ${fallback.a}/${fallback.b} (modifiable dans la section “Paires synthétiques”).`
      );
    } catch {}
  }

  return (
    <main className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-extrabold">SynPair Pro</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton global de rafraîchissement */}
          <button
            onClick={() => {
              supRef.current?.forceOnce?.();
              window.dispatchEvent(new CustomEvent("synpair:refresh"));
            }}
            className="badge"
            title="Forcer un cycle de rafraîchissement maintenant"
          >
            🔄 Rafraîchir maintenant
          </button>

          {/* Lien Aide */}
          <Link href="/help" className="badge" title="Voir la documentation">
            ❓ Aide
          </Link>

          <select
            className="input"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            title="Mode d’affichage"
          >
            <option value="detailed">Détaillé</option>
            <option value="compact">Compact</option>
          </select>

          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            title="Critère de tri"
          >
            <option value="signal">Trier par signal</option>
            <option value="price">Trier par prix</option>
            <option value="symbol">Trier par symbole</option>
          </select>

          <select
            className="input"
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value as any)}
            title="Filtrer par type de signal"
          >
            <option value="all">Tous</option>
            <option value="buy">Achat</option>
            <option value="neutral">Neutre</option>
            <option value="sell">Vente</option>
          </select>
        </div>
      </div>

      {/* Contrôles globaux : thème, source, intervalle, TF, indicateurs */}
      <Controls
        onChange={({ intervalMs }) => {
          supRef.current?.setInterval(intervalMs);
        }}
      />

      {/* Grille des tokens */}
      <div className={`grid gap-4 ${cols}`}>
        {rows.map((r) => {
          const sig = r._sig as "buy" | "neutral" | "sell";
          const color =
            sig === "buy"
              ? "bg-bull/20 text-bull"
              : sig === "sell"
              ? "bg-bear/20 text-bear"
              : "bg-neutral/20 text-neutral";
          const Icon = sig === "buy" ? TrendingUp : sig === "sell" ? TrendingDown : Minus;

          const inds = r.indicators || {};
          // Construit la liste d’indicateurs en respectant les cases cochées dans Controls
          const list = [
            // existants
            visibleInds.includes("ema20") && inds.ema20 !== undefined
              ? { k: "EMA20", v: inds.ema20 }
              : null,
            visibleInds.includes("ema60") && inds.ema60 !== undefined
              ? { k: "EMA60", v: inds.ema60 }
              : null,
            visibleInds.includes("rsi14") && inds.rsi14 !== undefined
              ? { k: "RSI14", v: inds.rsi14 }
              : null,
            visibleInds.includes("bb") && inds.bollinger
              ? {
                  k: "BB(20,2)",
                  v: `${inds.bollinger.lower?.toFixed?.(4) ?? "—"} / ${
                    inds.bollinger.mid?.toFixed?.(4) ?? "—"
                  } / ${inds.bollinger.upper?.toFixed?.(4) ?? "—"}`,
                }
              : null,
            visibleInds.includes("sigma30") && inds.sigma30 !== undefined
              ? { k: "σ30", v: inds.sigma30 }
              : null,
            visibleInds.includes("z30") && inds.z30 !== undefined
              ? { k: "Z30", v: inds.z30 }
              : null,

            // nouveaux
            visibleInds.includes("sma50") && inds.sma50 !== undefined
              ? { k: "SMA50", v: inds.sma50 }
              : null,
            visibleInds.includes("sma200") && inds.sma200 !== undefined
              ? { k: "SMA200", v: inds.sma200 }
              : null,
            visibleInds.includes("ema200") && inds.ema200 !== undefined
              ? { k: "EMA200", v: inds.ema200 }
              : null,
            visibleInds.includes("macd") && inds.macd !== undefined
              ? { k: "MACD", v: inds.macd }
              : null,
            visibleInds.includes("macdSignal") && inds.macdSignal !== undefined
              ? { k: "MACDsig", v: inds.macdSignal }
              : null,
            visibleInds.includes("macdHist") && inds.macdHist !== undefined
              ? { k: "MACDhist", v: inds.macdHist }
              : null,
            visibleInds.includes("atr14") && inds.atr14 !== undefined
              ? { k: "ATR14", v: inds.atr14 }
              : null,
            visibleInds.includes("mfi14") && inds.mfi14 !== undefined
              ? { k: "MFI14", v: inds.mfi14 }
              : null,
            visibleInds.includes("stoch14") && inds.stoch14 !== undefined
              ? { k: "Stoch%K", v: inds.stoch14 }
              : null,
          ].filter(Boolean) as { k: string; v: any }[];

          return (
            <div key={r.symbol} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold">{r.symbol}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">{r.source.toUpperCase()}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs border border-white/10 ${color}`}
                  >
                    <Icon className="inline h-4 w-4 -mt-0.5 mr-1" />{" "}
                    {sig === "buy" ? "Achat" : sig === "sell" ? "Vente" : "Neutre"}
                  </span>
                  <button
                    className="badge"
                    title="Ajouter en paire (A/ETH)"
                    onClick={() => addAsPair(r.symbol)}
                  >
                    <LinkIcon className="inline h-4 w-4 -mt-0.5 mr-1" />
                    Paired
                  </button>
                </div>
              </div>

              {r.error ? (
                <div className="text-red-500">Erreur: {r.error}</div>
              ) : (
                <>
                  <div className="text-2xl font-mono">{r.price ?? "—"}</div>

                  {/* Indicateurs sélectionnés */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {list.length === 0 && (
                      <div className="col-span-2 text-white/50">
                        Aucun indicateur sélectionné (voir “Indicateurs visibles” dans les
                        réglages).
                      </div>
                    )}
                    {list.map((it, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="text-xs opacity-60">{it.k}</div>
                        <div className="font-mono">
                          {typeof it.v === "number" ? Number(it.v).toFixed(4) : String(it.v)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-1 text-[11px] opacity-50">maj {timeAgo(r.ts)}</div>

                  {/* Bouton de refresh local (facultatif) */}
                  <div className="mt-2">
                    <button
                      className="btn-outline"
                      onClick={() => {
                        supRef.current?.forceOnce?.();
                        window.dispatchEvent(new CustomEvent("synpair:refresh"));
                      }}
                    >
                      Rafraîchir
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Gestion des paires et des tokens */}
      <PairManager />
      <TokenManager />
    </main>
  );
}
