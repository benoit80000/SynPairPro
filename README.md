# SynPair Pro (UI Patch + Chat Fix)
- UI améliorée: couleurs signal, filtres (signal), tri (signal/prix/symbole), vue compact/détaillée, tooltips, skeletons, horodatage relatif.
- Supervision multi-sources: **Binance**, **CoinGecko**, **CoinPaprika**, **CoinCap**
- Indicateurs: EMA20, EMA60, RSI14, Bollinger(20,2), σ30, Z-score(30) + **Signal (Achat/Neutre/Vente)**
- Gestion tokens: recherche multi-sources, ajout/suppression, **export/import**
- Chatbot: `/api/ai/chat` corrigé (Responses API). Définir `OPENAI_API_KEY` sur Vercel.

## Dev
```bash
npm i
npm run dev
```

## Déploiement Vercel
- Import GitHub
- Variables d'env: `OPENAI_API_KEY` (facultatif si pas de chatbot)
