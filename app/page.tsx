'use client';
export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import ThemeSwitch from '../components/ThemeSwitch';
import DashboardSummary from '../components/DashboardSummary';
import TokenCard from '../components/TokenCard';
import ChatBot from '../components/ChatBot';
import tokens from '../lib/tokens.json';
import { Plus, Grid2x2, List } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

type T = { name:string; symbol:string; binance_symbol?:string; coingecko_id?:string };
const ALL: T[] = (tokens as any).tokens;

export default function Page(){
  const [source, setSource] = useState<'binance'|'coingecko'>('binance');
  const [refreshMs, setRefreshMs] = useState<number>(5000);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [sel, setSel] = useState<string>('');
  const [watch, setWatch] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number|undefined>(undefined);

  useEffect(()=>{
    try {
      const s = (localStorage.getItem('source') as any) || 'binance';
      const r = Number(localStorage.getItem('refresh') || 5000);
      const v = (localStorage.getItem('view') as any) || 'grid';
      const w = JSON.parse(localStorage.getItem('watch') || '[]');
      setSource(s === 'coingecko' ? 'coingecko' : 'binance');
      setRefreshMs(Number.isFinite(r) && r >= 2000 ? r : 5000);
      setView(v === 'list' ? 'list' : 'grid');
      if (Array.isArray(w)) setWatch(w);
    } catch {}
  }, []);

  useEffect(()=>{ try{ localStorage.setItem('source', source); }catch{} },[source]);
  useEffect(()=>{ try{ localStorage.setItem('refresh', String(refreshMs)); }catch{} },[refreshMs]);
  useEffect(()=>{ try{ localStorage.setItem('view', view); }catch{} },[view]);
  useEffect(()=>{ try{ localStorage.setItem('watch', JSON.stringify(watch)); }catch{} },[watch]);

  const options = useMemo(()=> ALL.map(t => {
    const value = source==='binance' ? (t.binance_symbol || '') : (t.coingecko_id || '');
    const label = `${t.name} — ${source==='binance'?(t.binance_symbol || 'N/A'):(t.coingecko_id || 'N/A')}`;
    return { value, label, symbol: t.symbol, name: t.name };
  }).filter(o=>o.value), [source]);

  function addWatch(){ if (sel && !watch.includes(sel)) setWatch([...watch, sel]); }
  function removeWatch(id:string){ setWatch(watch.filter(x=>x!==id)); }

  return (
    <main className="max-w-6xl mx-auto p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="logo" width={36} height={36} />
          <div className="text-2xl font-black bg-gradient-to-r from-brandA to-brandB bg-clip-text text-transparent">SynPair Pro</div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch/>
        </div>
      </div>

      <DashboardSummary count={watch.length} source={source} refreshMs={refreshMs} lastUpdate={lastUpdate}/>

      <div className="card grid md:grid-cols-4 gap-3">
        <div className="md:col-span-1">
          <div className="small mb-1">Source</div>
          <select className="select" value={source} onChange={e=>setSource(e.target.value as any)}>
            <option value="binance">Binance</option>
            <option value="coingecko">CoinGecko</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="small mb-1">Token ({source==='binance'?'symbole Binance':'ID CoinGecko'})</div>
          <select className="select" value={sel} onChange={e=>setSel(e.target.value)}>
            <option value="">— Choisir un token —</option>
            {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <button className="button w-full" onClick={addWatch}><Plus size={16}/> Superviser</button>
        </div>
        <div className="md:col-span-1">
          <div className="small mb-1">Vue</div>
          <div className="flex gap-2">
            <button className={`button ${view==='grid'?'':'opacity-60'}`} onClick={()=>setView('grid')}><Grid2x2 size={16}/> Grille</button>
            <button className={`button ${view==='list'?'':'opacity-60'}`} onClick={()=>setView('list')}><List size={16}/> Liste</button>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="small mb-1">Rafraîchissement (s)</div>
          <input className="input" type="number" min={2} step={1} value={Math.round(refreshMs/1000)} onChange={e=>setRefreshMs(Math.max(2, Number(e.target.value))*1000)} />
        </div>
      </div>

      <div className={view==='grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
        <AnimatePresence mode="popLayout">
          {watch.map(id => {
            const meta = ALL.find(t => (source==='binance' ? t.binance_symbol : t.coingecko_id) === id);
            if (!meta) return null;
            return <TokenCard key={id} id={id} name={meta.name} symbol={meta.symbol} source={source} refreshMs={refreshMs} onRemove={()=>removeWatch(id)} onTick={(ts)=>setLastUpdate(ts)} />;
          })}
        </AnimatePresence>
      </div>

      <div className="text-center small">Next.js • Tailwind • Framer Motion • Lucide • Binance/CoinGecko • Historisation 5 min • MyAiTraderBot</div>

      <ChatBot/>
    </main>
  );
}
