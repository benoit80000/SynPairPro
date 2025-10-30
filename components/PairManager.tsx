'use client';
import React, { useEffect, useState } from 'react';
import { Link as LinkIcon, RefreshCw, Trash2 } from 'lucide-react';

/**
 * PairManager — section "Paires synthétiques" inspirée de l'ancien projet.
 * - Champs Token A / Token B + bouton "+ Ajouter la paire"
 * - Liste des paires existantes (storage "synpair_pairs_v1")
 * - Actions : Rafraîchir (émet synpair:refresh) & Supprimer
 * - Aucun impact global : même clé storage, mêmes events, même style de cartes/badges
 */
export default function PairManager() {
  const STORAGE_KEY = 'synpair_pairs_v1';
  const [pairs, setPairs] = useState<Array<{ a: string; b: string }>>([]);
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  // charge les paires au montage + sur evenement storage
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const parsed = JSON.parse(raw);
        setPairs(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPairs([]);
      }
    };
    load();
    const onStorage = () => load();
    window.addEventListener('storage', onStorage);
    window.addEventListener('synpair:pairsChanged', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('synpair:pairsChanged', onStorage);
    };
  }, []);

  const addPair = () => {
    const A = a.trim().toUpperCase();
    const B = b.trim().toUpperCase();
    if (!A || !B) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      const current: Array<{ a: string; b: string }> = JSON.parse(raw);
      const exists = current.some((p) => p.a === A && p.b === B);
      const next = exists ? current : [...current, { a: A, b: B }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPairs(next);
      // compat + event moderne
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('synpair:pairsChanged'));
      window.dispatchEvent(new CustomEvent('synpair:refresh'));
      setA('');
      setB('');
    } catch {}
  };

  const removePair = (idx: number) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      const current: Array<{ a: string; b: string }> = JSON.parse(raw);
      current.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      setPairs(current);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('synpair:pairsChanged'));
      window.dispatchEvent(new CustomEvent('synpair:refresh'));
    } catch {}
  };

  const refresh = () => {
    window.dispatchEvent(new CustomEvent('synpair:refresh'));
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2 text-xl font-bold">
        <LinkIcon className="h-5 w-5 opacity-80" />
        <span>Paires synthétiques</span>
      </div>

      {/* Bloc d'ajout façon ancien app */}
      <div className="card mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input"
            placeholder="Token A (ex: LINK)"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
          <input
            className="input"
            placeholder="Token B (ex: ETH)"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
          <button className="badge" onClick={addPair} title="Ajouter la paire A/B">
            + Ajouter la paire
          </button>
        </div>
        <div className="text-sm opacity-70 mt-2">
          Ajoute une paire pour voir le ratio A/B.
        </div>
      </div>

      {/* Liste des paires (inspirée du rendu ancien, mais non disruptive) */}
      <div className="card">
        {pairs.length === 0 ? (
          <div className="text-white/60">Aucune paire enregistrée.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {pairs.map((p, i) => (
              <li key={`${p.a}/${p.b}/${i}`} className="py-2 flex items-center justify-between">
                <div className="font-semibold">{p.a} / {p.b}</div>
                <div className="flex items-center gap-2">
                  <button className="badge" onClick={refresh} title="Rafraîchir maintenant">
                    <RefreshCw className="inline h-4 w-4 -mt-0.5 mr-1" />
                    Rafraîchir
                  </button>
                  <button
                    className="badge"
                    onClick={() => removePair(i)}
                    title="Supprimer cette paire"
                  >
                    <Trash2 className="inline h-4 w-4 -mt-0.5 mr-1" />
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
