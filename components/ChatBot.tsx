"use client";

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function ChatBot(){
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('Peux-tu analyser le RSI et les signaux actuels pour BTC et ETH ?');
  const [history, setHistory] = useState<{role:'user'|'assistant', text:string}[]>([]);

  async function send(){
    if (!input.trim()) return;
    const prompt = input.trim();
    setHistory(h=>[...h, {role:'user', text: prompt}]);
    setInput('');
    setBusy(true);
    try{
      const r = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'API error');
      setHistory(h=>[...h, {role:'assistant', text: j?.text || 'Réponse indisponible'}]);
    }catch(e:any){
      setHistory(h=>[...h, {role:'assistant', text: 'Assistant indisponible: '+(e?.message||'Erreur')}]);
    }finally{ setBusy(false); }
  }

  return <>
    <button onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 rounded-full p-3 bg-gradient-to-r from-brandA to-brandB text-black shadow-2xl">
      <MessageCircle />
    </button>
    {open && (
      <div className="fixed bottom-20 right-4 w-[360px] max-w-[95vw] card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-extrabold">MyAiTraderBot</div>
          <button className="badge" onClick={()=>setOpen(false)}>Fermer</button>
        </div>
        <div className="max-h-[50vh] overflow-auto space-y-2">
          {history.map((m,i)=>(
            <div key={i} className={m.role==='user'?'text-right':''}>
              <div className={'inline-block rounded-2xl px-3 py-2 ' + (m.role==='user'?'bg-white/20':'bg-black/30')}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input className="input flex-1" placeholder="Pose ta question…" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} />
          <button onClick={send} disabled={busy} className="button">{busy?'…':'Envoyer'}</button>
        </div>
        <div className="mt-1 text-[11px] text-white/50">⚠ Ceci n’est pas un conseil financier.</div>
      </div>
    )}
  </>;
}
