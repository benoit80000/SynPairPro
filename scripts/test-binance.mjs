const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5');
console.log('status', res.status);
console.log((await res.json()).map(x=>x[4]));
