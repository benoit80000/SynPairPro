export interface TokenItem {
  symbol: string;
  name: string;
  binance_symbol: string;
  coingecko_id?: string;
}
const DEFAULT_TOKENS: TokenItem[] = [
  { symbol: "BTC", name: "Bitcoin", binance_symbol: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", binance_symbol: "ETHUSDT" },
  { symbol: "LINK", name: "Chainlink", binance_symbol: "LINKUSDT" },
];
const STORAGE_KEY = "synpair_tokens";
export function loadTokens(): TokenItem[] {
  if (typeof window === "undefined") return DEFAULT_TOKENS;
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : DEFAULT_TOKENS; } catch { return DEFAULT_TOKENS; }
}
export function saveTokens(tokens: TokenItem[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}
export function resetTokens() { if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY); }