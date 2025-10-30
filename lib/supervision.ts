// lib/supervision.ts
export type IndicatorPack = {
  ema20?: number;
  ema60?: number;
  rsi14?: number;
  bollinger?: {
    lower?: number;
    mid?: number;
    upper?: number;
  } | null;
  sigma30?: number; // σ30
  z30?: number;     // Z-score 30
  sma50?: number;
  sma200?: number;
  ema200?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  atr14?: number;
  mfi14?: number;
  stoch14?: number; // Stoch %K
};

// (optionnel mais utile pour la lisibilité – adapte si déjà présent)
export type Source = "binance" | "coingecko" | "coinpaprika" | "coincap";

export type SupervisionRow = {
  symbol: string;
  source: Source;
  price?: number;
  ts?: number;
  indicators?: IndicatorPack;
  error?: string;
};

export type SupervisionState = Record<string, SupervisionRow>;
import { getTheme as settingsGetTheme } from "@/lib/settings";

let _source: Source = (typeof window !== "undefined" && (localStorage.getItem("source") as Source)) || "binance";
let _interval = (typeof window !== "undefined" && Number(localStorage.getItem("intervalMs"))) || 5000;

export function getSource(): Source { return _source; }
export function setSource(s: Source) { _source = s; if (typeof window!=="undefined") localStorage.setItem("source", s); }

export function getIntervalMs(): number { return _interval; }
export function setIntervalMs(ms: number) { _interval = ms; if (typeof window!=="undefined") localStorage.setItem("intervalMs", String(ms)); }

export function toggleTheme() {
  if (typeof window==="undefined") return;
  const root = document.documentElement;
  const wasLight = root.classList.contains("light");
  root.classList.toggle("light", !wasLight);
  localStorage.setItem("theme", !wasLight ? "light" : "dark");
}
export function getTheme(): "light"|"dark" {
  if (typeof window==="undefined") return "dark";
  return (localStorage.getItem("theme") as any) || "dark";
}

// Types supervision
export type TokenItem = {
  symbol: string;           // ex: "BTCUSDT" ou "eth"
  name?: string;
  source?: Source;          // source préférée pour ce token
  coingecko_id?: string;    // si utilisé chez Gecko
  binance_symbol?: string;  // si utilisé chez Binance
};

export type Row = {
  symbol: string;
  source: Source;
  price?: number;
  indicators?: IndicatorPack;
  ts?: number;
  ids: Partial<TokenItem>;
  error?: string;
};

export type SupervisionState = Record<string, Row>;

// superviseTokens: lance un polling et expose forceOnce / setInterval / stop
export function superviseTokens(tokens: TokenItem[], onUpdate:(s:SupervisionState)=>void) {
  let disposed = false;
  let timer: any = null;
  let state: SupervisionState = {};

  const source = getSource();
  const interval = getIntervalMs();

  async function tick(force=false) {
    if (disposed) return;
    try {
      const tf = (typeof window!=="undefined" && (localStorage.getItem("tf") || "1m")) || "1m";
      const operations = tokens.map(async (t)=>{
        const src: Source = t.source || source;
        const id =
          src==="binance" ? (t.binance_symbol || t.symbol) :
          src==="coingecko" ? (t.coingecko_id || t.symbol) :
          t.symbol;

        const url = `/api/history?id=${encodeURIComponent(id)}&source=${src}&interval=${tf}`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();

        const key = t.symbol.toUpperCase();
        if (!r.ok || j?.error) {
          state[key] = {
            symbol: key,
            source: src,
            ids: t,
            error: j?.error || `HTTP ${r.status}`,
            ts: Date.now(),
          };
        } else {
          const prices = j?.prices || [];
          const price = prices.length ? prices[prices.length-1] : undefined;
          state[key] = {
            symbol: key,
            source: src,
            price,
            indicators: j?.indicators,
            ts: j?.ts || Date.now(),
            ids: t,
          };
        }
      });

      await Promise.allSettled(operations);
      onUpdate({ ...state });
    } catch (e) {
      // ignore
    } finally {
      if (!disposed && !force) timer = setTimeout(()=>tick(false), getIntervalMs());
    }
  }

  function start() {
    if (timer) clearTimeout(timer);
    tick(true);
  }
  function stop() {
    disposed = true;
    if (timer) clearTimeout(timer);
  }
  function forceOnce() {
    if (timer) clearTimeout(timer);
    tick(true);
  }
  function setIntervalPublic(ms:number) {
    setIntervalMs(ms);
    if (timer) { clearTimeout(timer); timer = setTimeout(()=>tick(false), ms); }
  }

  start();

  return { stop, forceOnce, setInterval: setIntervalPublic };
}
