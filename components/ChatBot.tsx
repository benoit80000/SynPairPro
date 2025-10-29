'use client';
import { useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatBot(){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [messages,setMessages]=useState<{role:'user'|'assistant', content:string}[]>([
    { role:'assistant', content:'Salut ! Je suis MyAiTraderBot. Pose-moi une question sur les tokens surveillés, je peux analyser RSI/EMA/Bollinger et proposer une lecture rapide du marché.' }
  ]);
  const inputRef = useRef<HTMLInputElement|null>(null);
  async function send(msg?:string){
    const text = (msg ?? inputRef.current?.value ?? '').trim(); if(!text) return;
    setMessages(m=>[...m,{role:'user',content:text}]); setBusy(true); inputRef.current!.value='';
    try{
      const res = await fetch('/api/ai/chat', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ messages: [...messages, {role:'user',content:text}] }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Erreur API');
      setMessages(m=>[...m, {role:'assistant', content: j.reply || '(réponse vide)'}]);
    }catch(e:any){
      setMessages(m=>[...m, {role:'assistant', content: 'Assistant désactivé ou erreur API. Ajoute OPENAI_API_KEY dans Vercel.'}]);
    }finally{ setBusy(false); }
  }
  return <>
    <button onClick={()=>setOpen(true)} className="fixed bottom-4 right-4 rounded-full p-3 bg-gradient-to-r from-brandA to-brandB text-black shadow-2xl">
      <MessageCircle />
    </button>
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="fixed bottom-20 right-4 w-[360px] max-w-[95vw] card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold">MyAiTraderBot</div>
            <button onClick={()=>setOpen(false)} className="badge"><X size={16}/></button>
          </div>
          <div className="h-64 overflow-auto space-y-2 mb-3">
            {messages.map((m,i)=>(
              <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-xl ${m.role==='user'?'bg-brandA/20':'bg-white/10'} border border-white/10`}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input ref={inputRef} onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} placeholder="Demande une analyse…" className="input flex-1"/>
            <button onClick={()=>send()} className="button disabled:opacity-50">{busy? '…' : <Send size={16}/>}</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>;
}
