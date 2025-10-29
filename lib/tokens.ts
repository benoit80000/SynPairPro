export interface TokenItem {
  symbol: string;
  name: string;
  binance_symbol: string;
  coingecko_id?: string;
  coinpaprika_id?: string;
  coincap_id?: string;
}
const DEFAULT_TOKENS: TokenItem[] = [
  { symbol: "BTC", name: "Bitcoin", binance_symbol: "BTCUSDT", coincap_id: "bitcoin", coinpaprika_id: "btc-bitcoin", coingecko_id: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", binance_symbol: "ETHUSDT", coincap_id: "ethereum", coinpaprika_id: "eth-ethereum", coingecko_id: "ethereum" },
  { symbol: "LINK", name: "Chainlink", binance_symbol: "LINKUSDT", coincap_id: "chainlink", coinpaprika_id: "link-chainlink", coingecko_id: "chainlink" },
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
