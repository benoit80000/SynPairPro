"use client";
import { useEffect, useMemo, useState } from "react";
import { loadTokens } from "@/lib/tokens";
import { loadPairs, savePairs, PairItem } from "@/lib/pairs";
function PairRatio({ a, b }: { a: string; b: string }){
  const [ratio, setRatio] = useState<number|undefined>(undefined);
  const [pa, setPa] = useState<number|undefined>(undefined);
  const [pb, setPb] = useState<number|undefined>(undefined);
  useEffect(()=>{ const id = setInterval(()=>compute(), 1000); compute(); return ()=> clearInterval(id); }, [a,b]);
  function compute(){
    const s = (window as any).__synpair__?.tokens || {};
    const A = s[a]?.price; const B = s[b]?.price;
    setPa(A); setPb(B);
    if (typeof A === 'number' && typeof B === 'number' && B>0) setRatio(A/B); else setRatio(undefined);
  }
  return (
    <div className="mt-2 text-sm">
      <div className="text-white/70">Prix {a}: <span className="font-mono">{pa ?? '—'}</span></div>
      <div className="text-white/70">Prix {b}: <span className="font-mono">{pb ?? '—'}</span></div>
      <div className="mt-1 text-lg">Ratio <b>{a}/{b}</b>: <span className="font-mono">{ratio?.toFixed(6) ?? '—'}</span></div>
      <div className="text-xs text-white/50 mt-1">Les indicateurs restent par token (aucun indicateur de paire généré).</div>
    </div>
  );
}
export default function PairManager(){
  const [tokens, setTokens] = useState(loadTokens());
  const [pairs, setPairs]   = useState<PairItem[]>([]);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  useEffect(()=>{ setPairs(loadPairs()); }, []);
  useEffect(()=>{ setTokens(loadTokens()); }, []);
  const symbols = useMemo(()=> tokens.map(t=>t.symbol.toUpperCase()).sort(), [tokens]);
  function addPair(){ if (!a || !b || a===b) return; const p = { a, b }; const next = [...pairs.filter(x=> !(x.a===a && x.b===b)), p]; setPairs(next); savePairs(next); }
  function delPair(i:number){ const next = pairs.slice(); next.splice(i,1); setPairs(next); savePairs(next); }
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-2 text-2xl font-bold">🔗 Paires Synthétiques (Ratio A/B)</h2>
      <p className="text-sm text-white/70 mb-3">Choisis deux tokens supervisés pour créer une carte Ratio A/B.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <select className="input" value={a} onChange={(e)=>setA(e.target.value)}>
          <option value="">Token A</option>
          {symbols.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <div className="self-center text-white/60">÷</div>
        <select className="input" value={b} onChange={(e)=>setB(e.target.value)}>
          <option value="">Token B</option>
          {symbols.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={addPair} className="button">Ajouter la paire</button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {pairs.map((p, i)=>(
          <div key={`${p.a}/${p.b}/${i}`} className="card">
            <div className="flex items-center justify-between">
              <div className="font-bold">{p.a} / {p.b}</div>
              <button onClick={()=>delPair(i)} className="badge">🗑️ Supprimer</button>
            </div>
            <PairRatio a={p.a} b={p.b} />
          </div>
        ))}
        {pairs.length===0 && <div className="text-white/60">Aucune paire. Ajoute-en ci-dessus.</div>}
      </div>
    </div>
  );
}