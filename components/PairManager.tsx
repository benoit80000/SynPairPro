// components/PairManager.tsx
"use client";
import { useEffect, useState } from "react";
import type { SupervisionState } from "@/lib/supervision";

type Pair = { a: string; b: string };
const KEY = "synpair_pairs_v1";

function loadPairs(): Pair[] {
  if (typeof window==='undefined') return [];
  try { const s = localStorage.getItem(KEY); return s? JSON.parse(s): []; } catch { return []; }
}
function savePairs(p: Pair[]){ if (typeof window!=='undefined') localStorage.setItem(KEY, JSON.stringify(p)); }

export default function PairManager(){
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [state, setState] = useState<SupervisionState>({});

  useEffect(()=>{ setPairs(loadPairs()); },[]);
  useEffect(()=>{
    const t = setInterval(()=>{ setState((window as any).__synpair__?.tokens || {}); }, 1000);
    return ()=>clearInterval(t);
  },[]);

  function addPair(){
    if (!a || !b || a===b) return;
    const list = [...pairs.filter(p=>!(p.a===a && p.b===b)), { a: a.toUpperCase(), b: b.toUpperCase() }];
    setPairs(list); savePairs(list);
  }
  function delPair(i:number){
    const list = pairs.slice(); list.splice(i,1); setPairs(list); savePairs(list);
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-2 text-2xl font-bold">🔗 Paires synthétiques</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={a} onChange={e=>setA(e.target.value.toUpperCase())} className="input w-40" placeholder="Token A (ex: LINK)" />
        <input value={b} onChange={e=>setB(e.target.value.toUpperCase())} className="input w-40" placeholder="Token B (ex: ETH)" />
        <button onClick={addPair} className="button">➕ Ajouter la paire</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {pairs.map((p, i)=>{
          const pa = (state as any)[p.a]?.price; const pb = (state as any)[p.b]?.price;
          const ratio = (typeof pa==='number' && typeof pb==='number' && pb!==0) ? (pa/pb) : undefined;
          return (
            <div key={i} className="card">
              <div className="flex items-center justify-between">
                <div className="font-bold">{p.a} / {p.b}</div>
                <button className="badge" onClick={()=>delPair(i)}>🗑️</button>
              </div>
              <div className="mt-2 text-2xl font-mono">{ratio?.toPrecision(6) ?? "—"}</div>
              <div className="text-xs text-white/60">Basé sur les prix en supervision.</div>
            </div>
          );
        })}
        {pairs.length===0 && <div className="text-white/60">Ajoute une paire pour voir le ratio A/B.</div>}
      </div>
    </div>
  );
}
