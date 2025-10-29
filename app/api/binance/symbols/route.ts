import { NextResponse } from "next/server";
export const runtime = "edge";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const r = await fetch("https://api.binance.com/api/v3/exchangeInfo", { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
    const j = await r.json();
    const list = (j?.symbols || [])
      .filter((s: any) => s?.status === "TRADING" && s?.quoteAsset === "USDT")
      .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
    return NextResponse.json({ symbols: list });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "fetch error" }, { status: 500 });
  }
}