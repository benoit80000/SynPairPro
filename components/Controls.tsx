"use client";

import { useEffect, useState } from "react";
import { getIntervalMs, getSource, setIntervalMs, setSource } from "@/lib/supervision";
type Source = "binance" | "coingecko" | "coinpaprika" | "coincap";
type Props = { onChange?: (opts: { source: Source; intervalMs: number }) => void };
export default function Controls({ onChange }: Props) {
  const [source, setSrc] = useState<Source>(getSource() as any);
  const [intervalMs, setInt] = useState<number>(getIntervalMs());
  useEffect(() => { onChange?.({ source, intervalMs }); }, [source, intervalMs]); // eslint-disable-line
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Source</span>
        <select className="input" value={source}
          onChange={(e) => { const v = (e.target.value as any); setSrc(v); setSource(v); onChange?.({ source: v, intervalMs }); }}>
          <option value="binance">Binance</option>
          <option value="coingecko">CoinGecko</option>
          <option value="coinpaprika">CoinPaprika</option>
          <option value="coincap">CoinCap</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/60">Intervalle</span>
        <input className="input w-28" type="number" min={1000} step={1000} value={intervalMs}
          onChange={(e) => { const ms = Math.max(1000, Number(e.target.value) || 5000); setInt(ms); setIntervalMs(ms); onChange?.({ source, intervalMs: ms }); }}/>
        <span className="text-sm text-white/60">ms (défaut 5000)</span>
      </div>
    </div>
  );
}
