import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sources = [
  { name: "stooq-l-xau", url: "https://stooq.com/q/l/?s=xauusd&i=d" },
  { name: "stooq-l-xag", url: "https://stooq.com/q/l/?s=xagusd&i=d" },
  { name: "stooq-l-c-xau", url: "https://stooq.com/q/l/?s=xauusd&f=sd2t2ohlcv&h&e=csv" },
  { name: "stooq-q-xau", url: "https://stooq.com/q/?s=xauusd&f=sd2t2ohlcv&e=csv" },
  { name: "metals-live", url: "https://api.metals.live/v1/spot" },
  { name: "gold-api", url: "https://api.gold-api.com/price/XAU" },
  { name: "metals-dev", url: "https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz" },
  { name: "metalprice", url: "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU,XAG" },
];

export async function GET() {
  const results: any[] = [];
  for (const s of sources) {
    try {
      const r = await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", Accept: "*/*" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      const t = await r.text();
      results.push({ name: s.name, status: r.status, bytes: t.length, snippet: t.slice(0, 200) });
    } catch (e: any) {
      results.push({ name: s.name, error: String(e?.message || e) });
    }
  }
  return NextResponse.json({ results });
}
