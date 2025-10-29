export type PairItem = { a: string; b: string };
const STORAGE_KEY = "synpair_pairs";
export function loadPairs(): PairItem[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export function savePairs(pairs: PairItem[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
}