import { NextResponse } from "next/server";
import { ensureDb, sql } from "@/lib/db";
import { fetchLatestSpot, fetchHistory, ymd } from "@/lib/stooq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDb();
    const count = (await sql`SELECT COUNT(*)::int AS n FROM gsr_snapshots`) as Array<{ n: number }>;

    // Probe Stooq directly
    const latestGold = await fetchLatestSpot("xauusd");
    const latestSilver = await fetchLatestSpot("xagusd");

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400 * 1000);
    const hist = await fetchHistory("xauusd", ymd(start), ymd(end));

    // Raw probe
    let rawStatus: number | string = "n/a";
    let rawBytes = 0;
    let rawSnippet = "";
    try {
      const res = await fetch("https://stooq.com/q/l/?s=xauusd&i=d", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Accept: "text/csv,text/plain,*/*",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      rawStatus = res.status;
      const txt = await res.text();
      rawBytes = txt.length;
      rawSnippet = txt.slice(0, 200);
    } catch (e: unknown) {
      rawStatus = e instanceof Error ? e.message : "raw_failed";
    }

    return NextResponse.json({
      dbCount: count[0]?.n ?? 0,
      latestGold,
      latestSilver,
      historyDays: hist.length,
      historyFirst: hist[0],
      historyLast: hist[hist.length - 1],
      stooqProbe: { status: rawStatus, bytes: rawBytes, snippet: rawSnippet },
      env: { hasDb: !!process.env.DATABASE_URL },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
