'use client';
import { motion } from 'framer-motion';
export default function DashboardSummary({ count, source, refreshMs, lastUpdate }:{count:number; source:'binance'|'coingecko'; refreshMs:number; lastUpdate?:number}){
  const ago = lastUpdate ? Math.round((Date.now()-lastUpdate)/1000) : '—';
  return (
    <motion.div initial={{opacity:0, y:-8}} animate={{opacity:1, y:0}} className="card grid grid-cols-2 md:grid-cols-4 gap-4">
      <div><div className="small">Tokens supervisés</div><div className="text-xl font-extrabold">{count}</div></div>
      <div><div className="small">Source active</div><div className="text-xl font-extrabold capitalize">{source}</div></div>
      <div><div className="small">Rafraîchissement</div><div className="text-xl font-extrabold">{Math.round(refreshMs/1000)} s</div></div>
      <div><div className="small">Dernière mise à jour</div><div className="text-xl font-extrabold">{typeof ago==='number'? `${ago}s` : '—'}</div></div>
    </motion.div>
  );
}
