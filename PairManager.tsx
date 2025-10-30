import React, { useEffect, useState } from "react";

export default function PairManager() {
  const [pairs, setPairs] = useState<any[]>([]);

  useEffect(() => {
    const KEY = "synpair_pairs_v1";
    const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
    setPairs(stored);
  }, []);

  const refresh = () => window.dispatchEvent(new CustomEvent("synpair:refresh"));

  const removePair = (idx: number) => {
    const KEY = "synpair_pairs_v1";
    const current = JSON.parse(localStorage.getItem(KEY) || "[]");
    current.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(current));
    setPairs(current);
    refresh();
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-2">Paires synthétiques</h2>
      <div className="space-y-2">
        {pairs.length === 0 && <div className="text-white/50">Aucune paire.</div>}
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center justify-between border border-white/10 rounded-lg p-2">
            <span>
              {p.a} / {p.b}
            </span>
            <div className="flex gap-2">
              <button className="badge" onClick={() => removePair(i)}>
                Supprimer
              </button>
              <button className="badge" onClick={refresh}>
                🔄 Rafraîchir
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
