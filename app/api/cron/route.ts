import { NextResponse } from "next/server";
import { ensureDb, sql } from "@/lib/db";
import { fetchLatestSpot, isoDate } from "@/lib/stooq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily cron entrypoint (vercel.json schedules 0 6 * * * UTC).
// Vercel Cron requests include a Bearer with CRON_SECRET if configured.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    await ensureDb();
    const [g, s] = await Promise.all([
      fetchLatestSpot("xauusd"),
      fetchLatestSpot("xagusd"),
    ]);
    if (!g || !s || s.close <= 0) {
      return NextResponse.json({ ok: false, error: "feed_unavailable" }, { status: 502 });
    }
    const today = isoDate(new Date());
    const ratio = g.close / s.close;
    await sql`
      INSERT INTO gsr_snapshots (snapshot_date, gold_usd, silver_usd, ratio, source)
      VALUES (${today}, ${g.close}, ${s.close}, ${ratio}, 'cron')
      ON CONFLICT (snapshot_date) DO UPDATE
        SET gold_usd = EXCLUDED.gold_usd,
            silver_usd = EXCLUDED.silver_usd,
            ratio = EXCLUDED.ratio,
            source = EXCLUDED.source,
            created_at = NOW()
    `;
    return NextResponse.json({ ok: true, date: today, gold: g.close, silver: s.close, ratio });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
