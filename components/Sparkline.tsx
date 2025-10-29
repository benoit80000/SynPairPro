'use client';
import { useEffect, useRef } from 'react';
export default function Sparkline({ data, height=56, bands }: { data:number[]; height?:number; bands?: { mid?:number, upper?:number, lower?:number } }){
  const ref = useRef<HTMLCanvasElement|null>(null);
  useEffect(()=>{
    const c = ref.current!; const ctx = c.getContext('2d')!;
    const w = c.clientWidth; const h = height;
    c.width = w*devicePixelRatio; c.height = h*devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0,0,w,h); if (data.length<2) return;
    const min = Math.min(...data, bands?.lower ?? Infinity); const max = Math.max(...data, bands?.upper ?? -Infinity); const range = (max-min) || 1;
    if (bands?.upper!==undefined && bands?.lower!==undefined){
      const yU = h-((bands.upper-min)/range)*(h-2)-1;
      const yL = h-((bands.lower-min)/range)*(h-2)-1;
      ctx.fillStyle = 'rgba(122,102,255,0.12)'; ctx.fillRect(0, Math.min(yU,yL), w, Math.abs(yU-yL));
    }
    ctx.beginPath(); ctx.lineWidth=6; ctx.strokeStyle='rgba(109,214,255,.18)';
    data.forEach((v,i)=>{ const x=(i/(data.length-1))*(w-2)+1; const y=h-((v-min)/range)*(h-2)-1; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
    ctx.beginPath(); ctx.lineWidth=2; ctx.strokeStyle='#6ae3ff';
    data.forEach((v,i)=>{ const x=(i/(data.length-1))*(w-2)+1; const y=h-((v-min)/range)*(h-2)-1; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  },[data,height,bands]);
  return <canvas ref={ref} style={{width:'100%', height}} />;
}
