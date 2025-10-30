"use client";
import type { Source, TokenItem } from "@/lib/tokens";

export type IndicatorPack = {
  ema20?: number; ema60?: number; rsi14?: number;
  bollinger?: { mid?: number; upper?: number; lower?: number };
  sigma30?: number; z30?: number;
};
export type SupervisionRow = {
  symbol: string;
  source: Source;
  price?: number;
  indicators?: IndicatorPack;
  ts?: number;
  ids: Partial<TokenItem>;
  error?: string;
};
export type SupervisionState = Record<string, SupervisionRow>;

declare global { interface Window { __synpair__?: { tokens: SupervisionState; intervalMs: number }; } }

const SRC_KEY = "global_source";
export function getSource(): Source {
  if (typeof window === "undefined") return "binance";
  const s = localStorage.getItem(SRC_KEY) as Source | null;
  return (s === "binance" || s === "coingecko" || s === "coinpaprika" || s === "coincap") ? s : "binance";
}
export function setSource(s: Source) {
  if (typeof window !== "undefined") localStorage.setItem(SRC_KEY, s);
}

export function getIntervalMs(): number {
  const raw = (typeof window !== "undefined" && localStorage.getItem("poll_interval_ms")) || "5000";
  return Math.max(1000, Number(raw) || 5000);
}
export function setIntervalMs(ms: number) { if (typeof window !== "undefined") localStorage.setItem("poll_interval_ms", String(ms)); }
export function loadTF(): string { if (typeof window==='undefined') return '1m'; return localStorage.getItem('tf') || '1m'; }

async function fetchPack(row: SupervisionRow, tf: string) {
  const src = row.source;
  const idset = row.ids;
  if (src === "binance" && idset.binance_symbol) {
    const url = `/api/history?source=binance&id=${encodeURIComponent(idset.binance_symbol)}&interval=${encodeURIComponent(tf)}&limit=500`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (src === "coingecko" && idset.coingecko_id) {
    const daysMap:any = { "1m":1,"5m":1,"1h":1,"4h":7,"1d":30,"7d":7,"30d":30 };
    const days = daysMap[tf] || 1;
    const url = `/api/history?source=coingecko&id=${encodeURIComponent(idset.coingecko_id)}&days=${days}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (src === "coinpaprika" && idset.coinpaprika_id) {
    const url = `/api/history?source=coinpaprika&id=${encodeURIComponent(idset.coinpaprika_id)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (src === "coincap" && idset.coincap_id) {
    const url = `/api/history?source=coincap&id=${encodeURIComponent(idset.coincap_id)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  throw new Error("identifiant manquant pour la source");
}

export function superviseTokens(tokens: TokenItem[], onUpdate: (s: SupervisionState)=>void) {
  let disposed = false;
  let timer: any = null;

  const tf = loadTF();
  const intervalMs = getIntervalMs();
  let state: SupervisionState = {};

  tokens.forEach((t) => {
    // Si le token ne précise pas de source, on tombe sur la source globale choisie dans Controls
    const fallback = getSource();
    state[t.symbol.toUpperCase()] = {
      symbol: t.symbol.toUpperCase(),
      source: (t.source || fallback),
      ids: { ...t, source: (t.source || fallback) },
    };
  });
  push();

  async function cycle() {
    const entries = Object.values(state);
    for (const row of entries) {
      try {
        const pack = await fetchPack(row, tf);
        state[row.symbol] = { ...row, ...pack, error: undefined };
      } catch (e: any) {
        state[row.symbol] = { ...row, error: e?.message || "fetch error" };
      }
      if (disposed) return;
      push();
    }
  }

  function push() {
    if (typeof window !== "undefined") {
      (window as any).__synpair__ = { tokens: state, intervalMs };
    }
    onUpdate({ ...state });
  }

  function startLoop() {
    clearTimer();
    timer = setInterval(cycle, intervalMs);
    cycle().catch(() => {});
  }
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }

  startLoop();

  return {
    stop() { disposed = true; clearTimer(); },
    forceOnce() { cycle().catch(()=>{}); },
    setInterval(ms: number) { setIntervalMs(ms); clearTimer(); timer = setInterval(cycle, ms); }
  };
}
