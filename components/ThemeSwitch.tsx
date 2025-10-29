'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeSwitch(){
  const [light,setLight] = useState<boolean>(false);
  useEffect(()=>{ const v = localStorage.getItem('theme')==='light'; setLight(v); document.documentElement.classList.toggle('light', v); },[]);
  function toggle(){ const v = !light; setLight(v); localStorage.setItem('theme', v?'light':'dark'); document.documentElement.classList.toggle('light', v); }
  return <button className="button" onClick={toggle}>{light? <Moon size={16}/> : <Sun size={16}/>} {light? 'Sombre' : 'Clair'}</button>;
}
