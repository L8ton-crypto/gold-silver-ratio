import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const urls = [
  "https://api.gold-api.com/history/XAU",
  "https://api.gold-api.com/history/XAU?days=365",
  "https://api.frankfurter.dev/v1/2025-05-24..?base=USD&symbols=XAU,XAG",
  "https://api.frankfurter.app/2025-05-24..?base=USD&symbols=XAU,XAG",
  "https://datahub.io/core/gold-prices/r/monthly.json",
  "https://raw.githubusercontent.com/datasets/gold-prices/main/data/monthly.csv",
  "https://www.bullionvault.com/gold-price-chart.do?period=12months&currency=USD",
];

export async function GET() {
  const out: any[] = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      const t = await r.text();
      out.push({ u, status: r.status, bytes: t.length, head: t.slice(0, 250) });
    } catch (e: any) {
      out.push({ u, err: String(e?.message || e) });
    }
  }
  return NextResponse.json({ out });
}
