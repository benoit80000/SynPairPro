if (!process.env.OPENAI_API_KEY) { console.error('Set OPENAI_API_KEY first'); process.exit(1);} 
const payload={model:'gpt-4o-mini',messages:[{role:'system',content:'Say ok'},{role:'user',content:'ok?'}]};
const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
console.log('status', r.status); console.log(await r.json());
