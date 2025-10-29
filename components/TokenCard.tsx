'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Sparkline from './Sparkline';
import { computeIndicators, TokenIndicators } from './Indicators';
import { Trash2, Download } from 'lucide-react';

function fmt(n:number){ return (n>=1? n.toLocaleString(undefined,{maximumFractionDigits:4}) : n.toLocaleString(undefined,{maximumFractionDigits:8})); }

type Props = { id: string; name: string; symbol: string; source: 'binance'|'coingecko'; onRemove: ()=>void; refreshMs: number; onTick: (ts:number)=>void; };
type Row = { ts:number; price:number };

export default function TokenCard({ id, name, symbol, source, onRemove, refreshMs, onTick }: Props){
  const [price,setPrice]=useState<number|null>(null);
  const [hist,setHist]=useState<number[]>([]);
  const [err,setErr]=useState<string|null>(null);
  const [lastTs,setLastTs]=useState<number|undefined>(undefined);
  const [ind,setInd]=useState<TokenIndicators>({});
  const ctrl = useRef<AbortController|null>(null);
  const sampleTimer = useRef<any>(null);
  const keyHist = `${source}_${id}_5m`;

  useEffect(()=>{
    try { const raw = localStorage.getItem(keyHist); if(raw){ const rows = JSON.parse(raw) as Row[]; setHist(rows.map(r=>r.price)); } } catch {}
  }, [keyHist]);

  useEffect(()=>{ let t:any;
    async function tick(){
      ctrl.current?.abort(); ctrl.current=new AbortController();
      try{
        const res = await fetch(`/api/price?source=${source}&id=${encodeURIComponent(id)}`, { cache:'no-store', signal: ctrl.current.signal });
        const j = await res.json(); if(!res.ok) throw new Error(j.error || 'Request failed');
        setPrice(j.price); setErr(null); setLastTs(j.ts||Date.now()); onTick(Date.now());
        setHist(h=>{ const nx=[...h, j.price]; if(nx.length>720) nx.shift(); return nx; });
      }catch(e:any){ setErr(String(e?.message || 'Erreur réseau')); }
    }
    tick(); t=setInterval(tick, refreshMs);
    return ()=>{ clearInterval(t); ctrl.current?.abort(); };
  }, [id, source, refreshMs, onTick]);

  useEffect(()=>{ if(hist.length>=2) setInd(computeIndicators(hist)); }, [hist]);

  useEffect(()=>{
    function sampleNow(){
      if(price!==null){
        const rows: Row[] = (()=>{ try{ return JSON.parse(localStorage.getItem(keyHist) || '[]'); }catch{ return []; } })();
        rows.push({ ts: Date.now(), price }); while(rows.length>288) rows.shift();
        localStorage.setItem(keyHist, JSON.stringify(rows));
      }
    }
    const now=Date.now(); const msToNext = 300000 - (now % 300000);
    const first = setTimeout(()=>{ sampleNow(); sampleTimer.current = setInterval(sampleNow, 300000); }, msToNext);
    return ()=>{ clearTimeout(first); if(sampleTimer.current) clearInterval(sampleTimer.current); };
  }, [price, keyHist]);

  function exportCSV(){
    try{
      const rows: Row[] = JSON.parse(localStorage.getItem(keyHist) || '[]');
      const header = ['timestamp','datetime','price','ema20','ema60','rsi14','vol30','z30','bb_mid','bb_upper','bb_lower','signal'];
      const csv = [header.join(',')].concat(rows.map(r=>[r.ts, new Date(r.ts).toISOString(), r.price, ind.ema20??'', ind.ema60??'', ind.rsi14??'', ind.vol30??'', ind.z30??'', ind.bb_mid??'', ind.bb_upper??'', ind.bb_lower??'', ind.signal??''].join(','))).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`${symbol}_${source}_history_5m.csv`; a.click(); URL.revokeObjectURL(url);
    }catch{}
  }

  const bands = { mid: ind.bb_mid, upper: ind.bb_upper, lower: ind.bb_lower };
  const signalColor = ind.signal==='bullish' ? 'text-emerald-400' : ind.signal==='bearish' ? 'text-rose-400' : 'text-slate-400';

  return (
    <motion.div initial={{opacity:0, scale:.92, y:8, filter:'blur(6px)'}} animate={{opacity:1, scale:1, y:0, filter:'blur(0px)'}} transition={{type:'spring', stiffness:180, damping:18}} className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-extrabold">{name} <span className="badge">{symbol}</span></div>
          <div className="small">Dernière mise à jour : {lastTs? new Date(lastTs).toLocaleTimeString() : '—'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="badge" title="Exporter CSV"><Download size={16}/></button>
          <button onClick={onRemove} className="badge" title="Supprimer"><Trash2 size={16}/></button>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-3xl font-black">{price!==null? fmt(price) : '—'}</div>
        <div className={`small font-bold ${signalColor}`}>{ind.signal || 'neutral'}</div>
      </div>

      <div className="mt-3">
        <Sparkline data={hist} height={72} bands={bands}/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        <div className="card py-3"><div className="small">EMA20 / EMA60</div><div className="font-bold">{ind.ema20? fmt(ind.ema20):'—'} / {ind.ema60? fmt(ind.ema60):'—'}</div></div>
        <div className="card py-3"><div className="small">RSI(14)</div><div className="font-bold">{ind.rsi14!==undefined? ind.rsi14.toFixed(1) : '—'}</div></div>
        <div className="card py-3"><div className="small">σ (30)</div><div className="font-bold">{ind.vol30!==undefined? fmt(ind.vol30):'—'}</div></div>
        <div className="card py-3"><div className="small">Z-score (30)</div><div className="font-bold">{ind.z30!==undefined? ind.z30.toFixed(2):'—'}</div></div>
        <div className="card py-3"><div className="small">Bollinger mid</div><div className="font-bold">{ind.bb_mid? fmt(ind.bb_mid):'—'}</div></div>
        <div className="card py-3"><div className="small">Bollinger ±2σ</div><div className="font-bold">{ind.bb_lower? fmt(ind.bb_lower):'—'} / {ind.bb_upper? fmt(ind.bb_upper):'—'}</div></div>
      </div>
    </motion.div>
  );
}
