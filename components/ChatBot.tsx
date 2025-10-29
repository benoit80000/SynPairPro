"use client";
import { useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tokens from '@/lib/tokens';
type Msg = { role: 'user' | 'assistant'; content: string };
function extractSymbols(text:string): string[] {
  const re = /\b[A-Z]{2,10}\b/g;
  const found = (text.toUpperCase().match(re) || []);
  const ignore = new Set(['USDT','USD','BTC','ETH','LONG','SHORT','NEUTRE','RSI','EMA','BB','Z30','SCALPING','SWING']);
  return [...new Set(found.filter(s=>!ignore.has(s)))].slice(0, 6);
}
async function fetchIndicatorsFor(sym:string, source:'binance'|'coingecko') {
  const list = (tokens as any).loadTokens?.() || [];
  const t = list.find((x:any)=>x.symbol?.toUpperCase()===sym);
  if (!t) return null;
  const id = source==='binance' ? t.binance_symbol : t.coingecko_id;
  if (!id) return null;
  const url = source==='binance'
    ? `/api/history?source=binance&id=${encodeURIComponent(id)}&interval=1m&limit=180`
    : `/api/history?source=coingecko&id=${encodeURIComponent(id)}&days=1`;
  const r = await fetch(url, { cache:'no-store' });
  if (!r.ok) return null;
  const j = await r.json();
  return { id, symbol: sym, source, indicators: j.indicators, price: (j.prices||[]).slice(-1)[0] };
}
export default function ChatBot(){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [messages,setMessages]=useState<Msg[]>([{ role:'assistant', content:'👋 Salut ! Je suis MyAiTraderBot. Pose-moi une question.' }]);
  const inputRef = useRef<HTMLTextAreaElement|null>(null);
  async function send(msg?:string){
    const text = (msg ?? inputRef.current?.value ?? '').trim(); if(!text) return;
    setMessages(m=>[...m,{role:'user',content:text}]); setBusy(true); if(inputRef.current) inputRef.current.value='';
    try{
      const source = (localStorage.getItem('source') as any) === 'coingecko' ? 'coingecko' : 'binance';
      const existing = (window as any).__synpair__?.tokens || {};
      const symbols = extractSymbols(text);
      const ctxList:any[] = [];
      Object.values(existing).forEach((v:any)=>{ if (v?.source===source && v?.indicators) ctxList.push({ symbol: (v.symbol||'').toUpperCase(), source, price: v.price, indicators: v.indicators }); });
      for (const s of symbols) {
        if (ctxList.find(x=>x.symbol===s)) continue;
        const row = await fetchIndicatorsFor(s, source);
        if (row) ctxList.push({ symbol: s, source, price: row.price, indicators: row.indicators });
      }
      const ctxMsg = `Contexte tokens supervisés (auto) : ${JSON.stringify(ctxList)}`;
      const payload = { messages: [...messages, {role:'user', content: ctxMsg}, {role:'user', content: text}] };
      const res = await fetch('/api/ai/chat', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Erreur API');
      if (j.ok && j.analysis) {
        const a = j.analysis;
        const header = `🧭 ${a?.overview?.summary || 'Synthèse indisponible'}  ·  Bias: ${a?.overview?.market_bias || 'neutral'}`;
        setMessages(m=>[...m, {role:'assistant', content: header}]);
        (a?.tokens||[]).forEach((t:any)=>{
          const conf = Math.round((t?.confidence||0)*100);
          const block = [
            `• ${t?.symbol} — ${t?.signal} (${conf}%)`,
            ...(t?.reasons?.slice(0,3) || []),
            t?.risk ? `risk: stop=${t.risk.stop ?? '—'} tp=${t.risk.take_profit ?? '—'} size≈${t.risk.size_pct}%` : ''
          ].filter(Boolean).join('\n');
          setMessages(m=>[...m, {role:'assistant', content: block}]);
        });
      } else { setMessages(m=>[...m, {role:'assistant', content: j.reply || '(réponse vide)'}]); }
    }catch(e:any){ setMessages(m=>[...m, {role:'assistant', content: '❌ ' + (e?.message || 'Assistant désactivé ou erreur API.')}]); }
    finally{ setBusy(false); }
  }
  return (<>
    <button onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 rounded-full p-3 bg-gradient-to-r from-[#7B61FF] to-[#00FFFF] text-black shadow-2xl"><MessageCircle /></button>
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="fixed bottom-20 right-4 max-w-[95vw] md:max-w-[480px] bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3" style={{ maxHeight: '80vh' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold">MyAiTraderBot</div>
            <button onClick={()=>setOpen(false)} className="badge"><X size={16}/></button>
          </div>
          <div className="overflow-auto space-y-2 mb-3 pr-1" style={{ maxHeight: '60vh' }}>
            {messages.map((m,i)=>(
              <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-xl ${m.role==='user'?'bg-[#7B61FF]/20':'bg-white/10'} border border-white/10 whitespace-pre-wrap`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={(el)=>{ if(el){ el.style.height='0px'; el.style.height = el.scrollHeight+'px'; } (inputRef as any).current = el; }}
              onInput={(e:any)=>{ e.currentTarget.style.height='0px'; e.currentTarget.style.height = e.currentTarget.scrollHeight+'px'; }}
              onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder="Demande une analyse… (Shift+Entrée pour nouvelle ligne)"
              className="input flex-1 min-h-[40px] max-h-[30vh] resize-none"
            />
            <button onClick={()=>send()} className="button disabled:opacity-50">{busy? '…' : <Send size={16}/>}</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>);
}