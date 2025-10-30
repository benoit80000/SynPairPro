// app/help/page.tsx
"use client";

import Link from "next/link";

export default function HelpPage() {
  const INDICATORS = [
    {
      name: "EMA (Exponential Moving Average)",
      key: "EMA20 / EMA60 / EMA200",
      desc: "Moyenne mobile exponentielle. Donne plus de poids aux données récentes. Sert à détecter la tendance (haussière si le prix > EMA).",
    },
    {
      name: "SMA (Simple Moving Average)",
      key: "SMA50 / SMA200",
      desc: "Moyenne simple sur une période fixe. Utilisée pour identifier les tendances longues (SMA200) ou moyennes (SMA50).",
    },
    {
      name: "RSI (Relative Strength Index)",
      key: "RSI14",
      desc: "Oscillateur de momentum. Indique les zones de surachat (>70) ou de survente (<30).",
    },
    {
      name: "Bollinger Bands",
      key: "BB(20,2)",
      desc: "Canaux basés sur une moyenne et une déviation standard. Le prix proche de la bande inférieure = sous-évaluation possible.",
    },
    {
      name: "σ30 (Écart type sur 30 périodes)",
      key: "σ(30)",
      desc: "Mesure la volatilité du marché sur 30 périodes. Plus σ est élevé, plus la volatilité est forte.",
    },
    {
      name: "Z-score(30)",
      key: "Z30",
      desc: "Distance du prix par rapport à sa moyenne (en nombre d’écarts-types). Permet de détecter les anomalies de prix.",
    },
    {
      name: "MACD (Moving Average Convergence Divergence)",
      key: "MACD / Signal / Hist",
      desc: "Compare deux moyennes mobiles exponentielles (12 et 26). Si MACD > signal = momentum haussier.",
    },
    {
      name: "ATR (Average True Range)",
      key: "ATR14",
      desc: "Mesure la volatilité moyenne du prix (écart moyen entre les hauts et bas). Ne donne pas la direction, mais l’amplitude.",
    },
    {
      name: "MFI (Money Flow Index)",
      key: "MFI14",
      desc: "RSI pondéré par les volumes. Indique l’accumulation ou la distribution du capital sur l’actif.",
    },
    {
      name: "Stochastique %K",
      key: "Stoch14",
      desc: "Compare le prix actuel au range des N dernières périodes. >80 = surachat, <20 = survente.",
    },
  ];

  const SIGNALS = [
    {
      label: "Achat (buy)",
      desc: "Les indicateurs sont globalement positifs : prix > EMA, RSI bas, ou cassure haussière.",
    },
    {
      label: "Neutre (neutral)",
      desc: "Les signaux sont mitigés. Aucun consensus net entre les indicateurs.",
    },
    {
      label: "Vente (sell)",
      desc: "Les indicateurs sont globalement négatifs : prix < EMA, RSI élevé, ou cassure baissière.",
    },
  ];

  const SOURCES = [
    { name: "Binance", desc: "Données en temps réel (OHLCV). Source par défaut si disponible." },
    { name: "CoinGecko", desc: "Historique simplifié des prix. Gratuit et fiable, sans clé API." },
    { name: "CoinPaprika", desc: "Alternative à Gecko. Donne des données OHLC complètes." },
    { name: "CoinCap", desc: "Flux léger et rapide pour les prix uniquement (pas d’OHLC)." },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-4">📘 Aide & Documentation</h1>
      <p className="text-white/70 mb-6">
        Cette page explique les principaux concepts et indicateurs utilisés par <strong>SynPair Pro</strong>.
      </p>

      {/* Indicateurs */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-3">📊 Indicateurs techniques</h2>
        <div className="space-y-3">
          {INDICATORS.map((ind, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-lg font-semibold">{ind.name}</div>
              <div className="text-sm text-white/70 mb-1">{ind.key}</div>
              <div className="text-sm">{ind.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Signaux */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-3">📈 Interprétation des signaux</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {SIGNALS.map((s, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-semibold mb-1">{s.label}</div>
              <div className="text-sm">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-3">🌐 Sources de données</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {SOURCES.map((src, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-semibold mb-1">{src.name}</div>
              <div className="text-sm">{src.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <div className="mt-10 text-center">
        <Link href="/" className="btn">
          ← Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
