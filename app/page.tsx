"use client";
import { useEffect, useRef, useState } from "react";
import Controls from "@/components/Controls";
import TokenManager from "@/components/TokenManager";
import PairManager from "@/components/PairManager";
import ChatBot from "@/components/ChatBot";
import { loadTokens, TokenItem } from "@/lib/tokens";
import { SupervisionState, superviseTokens } from "@/lib/supervision";
export default function Page() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [state, setState] = useState<SupervisionState>({});
  const stopRef = useRef<{ stop: () => void; setInterval: (ms: number) => void } | null>(null);
  useEffect(() => { setTokens(loadTokens()); }, []);
  useEffect(() => {
    if (!tokens.length) return;
    stopRef.current?.stop?.();
    stopRef.current = superviseTokens(
      tokens.map((t) => ({ symbol: t.symbol, name: t.name, binance_symbol: t.binance_symbol, coingecko_id: t.coingecko_id })),
      (s) => setState(s)
    );
    return () => stopRef.current?.stop?.();
  }, [tokens]);
  return (
    <main className="min-h-screen p-6 text-white">
      <h1 className="mb-4 text-3xl font-extrabold">Supervision</h1>
      <Controls onChange={({ intervalMs }) => { stopRef.current?.setInterval(intervalMs); }} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(state).map((r) => (
          <div key={r.symbol} className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-bold">{r.symbol}</div>
              <div className="text-xs text-white/60">{r.source.toUpperCase()}</div>
            </div>
            {r.error ? (
              <div className="text-red-400">Erreur: {r.error}</div>
            ) : (
              <>
                <div className="text-2xl font-mono">{r.price ?? "—"}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="badge">RSI14: {r.indicators?.rsi14?.toFixed(1) ?? "—"}</div>
                  <div className="badge">EMA20: {r.indicators?.ema20?.toFixed(4) ?? "—"}</div>
                  <div className="badge">EMA60: {r.indicators?.ema60?.toFixed(4) ?? "—"}</div>
                  <div className="badge">σ30: {r.indicators?.sigma30?.toFixed(6) ?? "—"}</div>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  BB mid: {r.indicators?.bollinger?.mid?.toFixed(4) ?? "—"} · up: {r.indicators?.bollinger?.upper?.toFixed(4) ?? "—"} · low: {r.indicators?.bollinger?.lower?.toFixed(4) ?? "—"}
                </div>
              </>
            )}
          </div>
        ))}
        {Object.keys(state).length === 0 && <div className="text-white/60">Ajoute des tokens pour démarrer la supervision.</div>}
      </div>
      <PairManager />
      <TokenManager />
      <ChatBot />
    </main>
  );
}