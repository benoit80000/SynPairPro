"use client";

import { useEffect, useState } from "react";
import { getIntervalMs, setIntervalMs, getSource, setSource, toggleTheme, getTheme } from "@/lib/supervision";
import { ALL_INDICATORS, loadIndicators, saveIndicators, TF, loadTF, saveTF } from "@/lib/settings";

type Source = "binance" | "coingecko" | "coinpaprika" | "coincap";

export default function Controls({ onChange }: { onChange?: (p:{intervalMs:number})=>void }) {
  const [intervalMs, setInt] = useState(getIntervalMs());
  const [source, setSrc] = useState<Source>(getSource());
  const [tf, setTf] = useState<TF>(loadTF());
  const [inds, setInds] = useState(loadIndicators());
  const [theme, setTheme] = useState<"light"|"dark">(getTheme());

  useEffect(()=>{ onChange?.({intervalMs}); },[intervalMs, onChange]);

  function applyRefresh() {
    window.dispatchEvent(new CustomEvent("synpair:refresh"));
  }

  return (
    <div className="card mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Source */}
      <div className="flex flex-col gap-1">
        <div className="text-xs opacity-60">Source</div>
        <select
          className="select"
          value={source}
          onChange={(e)=>{
            const v = e.target.value as Source;
            setSrc(v); setSource(v); applyRefresh();
          }}>
          <option value="binance">Binance (OHLCV)</option>
          <option value="coingecko">CoinGecko</option>
          <option value="coinpaprika">CoinPaprika</option>
          <option value="coincap">CoinCap</option>
        </select>
      </div>

      {/* Timeframe */}
      <div className="flex flex-col gap-1">
        <div className="text-xs opacity-60">Unité de temps</div>
        <select
          className="select"
          value={tf}
          onChange={(e)=>{
            const v = e.target.value as TF;
            setTf(v); saveTF(v); applyRefresh();
          }}>
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
      </div>

      {/* Intervalle */}
      <div className="flex flex-col gap-1">
        <div className="text-xs opacity-60">Rafraîchissement</div>
        <div className="flex gap-2">
          <input
            className="input w-full"
            type="number"
            min={1000}
            step={1000}
            value={intervalMs}
            onChange={(e)=>{
              const ms = Math.max(1000, Number(e.target.value||5000));
              setInt(ms); setIntervalMs(ms);
            }}
          />
          <button className="btn-outline" onClick={()=>{ setIntervalMs(intervalMs); applyRefresh(); }}>
            Appliquer
          </button>
        </div>
      </div>

      {/* Thème + Refresh */}
      <div className="flex items-end justify-between gap-2">
        <button
          className="btn-outline"
          onClick={()=>{
            toggleTheme();
            setTheme(t=> t==="dark" ? "light" : "dark");
          }}>
          {theme==="dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        </button>
        <button className="btn" onClick={applyRefresh}>🔄 Rafraîchir</button>
      </div>

      {/* Indicateurs visibles */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className="mb-2 text-xs opacity-60">Indicateurs visibles</div>
        <div className="flex flex-wrap gap-2">
          {ALL_INDICATORS.map(k=>{
            const on = inds.includes(k as any);
            return (
              <button
                key={k}
                className={on ? "badge" : "btn-outline"}
                onClick={()=>{
                  const next = on ? inds.filter(x=>x!==k) : [...inds, k as any];
                  setInds(next); saveIndicators(next); applyRefresh();
                }}>
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
