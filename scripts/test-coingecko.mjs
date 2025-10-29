const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
console.log('status', res.status);
console.log((await res.json()).prices?.slice(-5));
