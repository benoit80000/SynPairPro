export type Source = "binance" | "coingecko" | "coinpaprika" | "coincap";
export interface TokenItem {
  symbol: string;
  name: string;
  source?: Source;  // preferred source
  binance_symbol?: string;
  coingecko_id?: string;
  coinpaprika_id?: string;
  coincap_id?: string;
}
const DEFAULT: TokenItem[] = [
  { symbol: "BTC", name: "Bitcoin", source:"binance", binance_symbol:"BTCUSDT", coingecko_id:"bitcoin", coinpaprika_id:"btc-bitcoin", coincap_id:"bitcoin" },
  { symbol: "ETH", name: "Ethereum", source:"binance", binance_symbol:"ETHUSDT", coingecko_id:"ethereum", coinpaprika_id:"eth-ethereum", coincap_id:"ethereum" },
  { symbol: "LINK", name: "Chainlink", source:"binance", binance_symbol:"LINKUSDT", coingecko_id:"chainlink", coinpaprika_id:"link-chainlink", coincap_id:"chainlink" },
];
const KEY = "synpair_tokens_v2";
export function loadTokens(): TokenItem[] {
  if (typeof window === 'undefined') return DEFAULT;
  try { const s = localStorage.getItem(KEY); return s? JSON.parse(s): DEFAULT; } catch { return DEFAULT; }
}
export function saveTokens(t: TokenItem[]){ if (typeof window!=='undefined') localStorage.setItem(KEY, JSON.stringify(t)); }
export function resetTokens(){ if (typeof window!=='undefined') localStorage.removeItem(KEY); }
