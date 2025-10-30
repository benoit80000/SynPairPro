// components/Controls.tsx
"use client";
import { useEffect, useState } from "react";
import { getTheme, toggleTheme, loadIndicators, saveIndicators, loadTF, saveTF, ALL_INDICATORS, IndicatorKey } from "@/lib/settings";
import { getIntervalMs, setIntervalMs, getSource, setSource } from "@/lib/supervision";

type Source = "binance"|"coingecko"|"coinpaprika"|"coincap";
type Props = { onChange?: (opts: { source: Source; intervalMs: number }) => void };

export default function Controls({ onChange }: Props) {
  const [intervalMs, setInt] = useState<number>(getIntervalMs());
  const [theme, setThemeState] = useState<'dark'|'light'>(getTheme());
  const [tf, setTF] = useState(loadTF());
  const [inds, setInds] = useState<IndicatorKey[]>(loadIndicators());
  const [source, setSrc] = useState<Source>(getSource());

  useEffect(() => { onChange?.({ source, intervalMs }); }, [source, intervalMs]); // eslint-disable-line

  function toggleInd(k: IndicatorKey){
    let next = inds.includes(k) ? inds.filter(x=>x!==k) : [...inds, k];
    setInds(next); saveIndicators(next);
    window.dispatchEvent(new CustomEvent('synpair:refresh'));
  }

  function toggleThemeSafe(){
    toggleTheme();
    setThemeState(getTheme());
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button className="badge" onClick={toggleThemeSafe}>🌓 Thème: {theme==='dark'?'Dark':'Light'}</button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Source</span>
          <select className="input" value={source} onChange={(e)=>{ const s = e.target.value as Source; setSrc(s); setSource(s); window.dispatchEvent(new CustomEvent('synpair:refresh')); }}>
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
          <span className="text-sm text-white/60">ms</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">TF</span>
          <select className="input" value={tf} onChange={(e)=>{ const v = e.target.value; setTF(v as any); saveTF(v as any); window.dispatchEvent(new CustomEvent('synpair:refresh')); }}>
            <option value="1m">1m</option><option value="5m">5m</option><option value="1h">1h</option>
            <option value="4h">4h</option><option value="1d">1d</option><option value="7d">7d</option><option value="30d">30d</option>
          </select>
        </div>

        <button onClick={()=>window.dispatchEvent(new CustomEvent('synpair:refresh'))} className="badge">🔄 Rafraîchir</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-white/60">Indicateurs visibles :</span>
        {ALL_INDICATORS.map(k=>(
          <label key={k} className="badge cursor-pointer">
            <input type="checkbox" className="mr-2" checked={inds.includes(k)} onChange={()=>toggleInd(k)} /> {k.toUpperCase()}
          </label>
        ))}
      </div>
    </div>
  );
}
