'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeSwitch from '../../components/ThemeSwitch';
import Sparkline from '../../components/Sparkline';

type M = {
  timestamp:number;
  binance_latency_ms:number; binance_ok:boolean;
  coingecko_latency_ms:number; coingecko_ok:boolean;
  openai_latency_ms:number|null; openai_ok:boolean|null;
  tokens_monitored:number;
};

function status(ms:number|undefined|null, ok:boolean|undefined|null){
  if (ok === false) return { label:'Erreur', color:'text-rose-400' };
  if (ms==null) return { label:'Inactif', color:'text-slate-400' };
  if (ms<250) return { label:'OK', color:'text-emerald-400' };
  if (ms<800) return { label:'Lent', color:'text-amber-400' };
  return { label:'Dégradé', color:'text-orange-500' };
}

export default function Health(){
  const [histB,setHistB]=useState<number[]>([]);
  const [histC,setHistC]=useState<number[]>([]);
  const [histO,setHistO]=useState<number[]>([]);
  const [last, setLast] = useState<M|null>(null);

  async function pull(){
    const tokens = Number(localStorage.getItem('watch') ? JSON.parse(localStorage.getItem('watch')!).length : 0);
    const r = await fetch(`/api/metrics?tokens=${tokens}`, { cache:'no-store' });
    const j: M = await r.json();
    setLast(j);
    setHistB(h=>{ const nx=[...h, j.binance_latency_ms]; if(nx.length>60) nx.shift(); return nx; });
    setHistC(h=>{ const nx=[...h, j.coingecko_latency_ms]; if(nx.length>60) nx.shift(); return nx; });
    if (j.openai_latency_ms!=null) setHistO(h=>{ const nx=[...h, j.openai_latency_ms!]; if(nx.length>60) nx.shift(); return nx; });
  }

  useEffect(()=>{ pull(); const t=setInterval(pull, 10000); return ()=>clearInterval(t); }, []);

  return (
    <main className="max-w-5xl mx-auto p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="logo" width={36} height={36} />
          <div className="text-2xl font-black bg-gradient-to-r from-brandA to-brandB bg-clip-text text-transparent">SynPair Pro — Health</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="button">← Dashboard</Link>
          <ThemeSwitch/>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold">Binance</div>
            <div className={`small font-bold ${status(last?.binance_latency_ms, last?.binance_ok).color}`}>{status(last?.binance_latency_ms, last?.binance_ok).label}</div>
          </div>
          <div className="text-3xl font-black">{last? `${last.binance_latency_ms} ms` : '—'}</div>
          <div className="mt-3"><Sparkline data={histB} height={56}/></div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold">CoinGecko</div>
            <div className={`small font-bold ${status(last?.coingecko_latency_ms, last?.coingecko_ok).color}`}>{status(last?.coingecko_latency_ms, last?.coingecko_ok).label}</div>
          </div>
          <div className="text-3xl font-black">{last? `${last.coingecko_latency_ms} ms` : '—'}</div>
          <div className="mt-3"><Sparkline data={histC} height={56}/></div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold">OpenAI</div>
            <div className={`small font-bold ${status(last?.openai_latency_ms??undefined, last?.openai_ok??undefined).color}`}>{status(last?.openai_latency_ms??undefined, last?.openai_ok??undefined).label}</div>
          </div>
          <div className="text-3xl font-black">{last?.openai_latency_ms!=null? `${last.openai_latency_ms} ms` : '—'}</div>
          <div className="mt-3"><Sparkline data={histO} height={56}/></div>
        </div>
      </div>

      <div className="card grid md:grid-cols-3 gap-4">
        <div>
          <div className="small">Tokens surveillés</div>
          <div className="text-xl font-extrabold">{last?.tokens_monitored ?? '—'}</div>
        </div>
        <div>
          <div className="small">Dernier check</div>
          <div className="text-xl font-extrabold">{last? new Date(last.timestamp).toLocaleTimeString() : '—'}</div>
        </div>
        <div>
          <div className="small">Version</div>
          <div className="text-xl font-extrabold">v2.1.0</div>
        </div>
      </div>
    </main>
  );
}
