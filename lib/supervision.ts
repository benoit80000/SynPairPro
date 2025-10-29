"use client";

type Source = "binance" | "coingecko" | "coinpaprika" | "coincap";

export type IndicatorPack = {
  ema20?: number;
  ema60?: number;
  rsi14?: number;
  bollinger?: { mid?: number; upper?: number; lower?: number };
  sigma30?: number;
  z30?: number;
};

export type SupervisionRow = {
  symbol: string;
  source: Source;
  price?: number;
  indicators?: IndicatorPack;
  ts?: number;
  binance_symbol?: string;
  coingecko_id?: string;
  coinpaprika_id?: string;
  coincap_id?: string;
  error?: string;
};

export type SupervisionState = Record<string, SupervisionRow>;

declare global {
  interface Window {
    __synpair__?: { tokens: SupervisionState; source: Source; intervalMs: number };
  }
}

export function getSource(): Source {
  const s = (typeof window !== "undefined" && localStorage.getItem("source")) || "binance";
  if (s === "coingecko" || s === "coinpaprika" || s === "coincap") return s as any;
  return "binance";
}
export function setSource(s: Source) { if (typeof window !== "undefined") localStorage.setItem("source", s); }
export function getIntervalMs(): number {
  const raw = (typeof window !== "undefined" && localStorage.getItem("poll_interval_ms")) || "5000";
  const v = Math.max(1000, Number(raw) || 5000);
  return v;
}
export function setIntervalMs(ms: number) { if (typeof window !== "undefined") localStorage.setItem("poll_interval_ms", String(ms)); }

async function fetchPack(row: { source: Source; binance_symbol?: string; coingecko_id?: string; coinpaprika_id?: string; coincap_id?: string }) {
  if (row.source === "binance" && row.binance_symbol) {
    const url = `/api/history?source=binance&id=${encodeURIComponent(row.binance_symbol)}&interval=1m&limit=180`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (row.source === "coingecko" && row.coingecko_id) {
    const url = `/api/history?source=coingecko&id=${encodeURIComponent(row.coingecko_id)}&days=1`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (row.source === "coinpaprika" && row.coinpaprika_id) {
    const url = `/api/history?source=coinpaprika&id=${encodeURIComponent(row.coinpaprika_id)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  if (row.source === "coincap" && row.coincap_id) {
    const url = `/api/history?source=coincap&id=${encodeURIComponent(row.coincap_id)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const price = Array.isArray(j?.prices) && j.prices.length ? j.prices[j.prices.length - 1] : undefined;
    return { price, indicators: j?.indicators, ts: Date.now() };
  }
  throw new Error("identifiant manquant pour la source");
}

export function superviseTokens(tokens: { symbol: string; name: string; binance_symbol: string; coingecko_id?: string; coinpaprika_id?: string; coincap_id?: string }[], onUpdate: (s: SupervisionState)=>void) {
  let disposed = false;
  let timer: any = null;

  const source: Source = getSource();
  const intervalMs = getIntervalMs();
  let state: SupervisionState = {};

  tokens.forEach((t) => {
    state[t.symbol.toUpperCase()] = {
      symbol: t.symbol.toUpperCase(),
      source,
      binance_symbol: t.binance_symbol,
      coingecko_id: t.coingecko_id,
      coinpaprika_id: t.coinpaprika_id,
      coincap_id: t.coincap_id,
    };
  });
  push();

  async function cycle() {
    const entries = Object.values(state);
    for (const row of entries) {
      try {
        const pack = await fetchPack(row);
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
      window.__synpair__ = { tokens: state, source, intervalMs };
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
