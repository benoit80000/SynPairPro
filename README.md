# SynPair Pro (Next.js 14 + TS)
- Supervision multi-sources: **Binance**, **CoinGecko**, **CoinPaprika**, **CoinCap**
- Indicateurs: EMA20, EMA60, RSI14, Bollinger(20,2), σ30, Z-score(30) + **Signal (Achat/Neutre/Vente)**
- Gestion tokens: recherche multi-sources, ajout/suppression, **export/import**
- Rafraîchissement: bouton global + auto après ajout
- Chatbot: `/api/ai/chat` (via OpenAI Responses API). Définir `OPENAI_API_KEY` sur Vercel.

## Dev
```bash
npm i
npm run dev
```

## Déploiement Vercel
- Import GitHub
- Variables d'env: `OPENAI_API_KEY` (facultatif si pas de chatbot)
