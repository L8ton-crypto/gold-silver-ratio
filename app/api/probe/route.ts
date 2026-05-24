import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const urls = [
    "https://stooq.com/q/d/l/?s=xauusd&d1=20250524&d2=20260524&i=d",
    "https://stooq.com/q/d/l/?s=xauusd&i=d",
    "https://stooq.com/q/d/?s=xauusd&i=d&d1=20250524&d2=20260524&e=csv&h",
  ];
  const results: any[] = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Accept: "text/csv,*/*",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const t = await r.text();
      results.push({ url, status: r.status, bytes: t.length, head: t.slice(0, 300), tail: t.slice(-200) });
    } catch (e: any) {
      results.push({ url, err: String(e?.message || e) });
    }
  }
  return NextResponse.json({ results });
}
