import { NextResponse } from "next/server";
import { ensureDb, sql } from "@/lib/db";
import { fetchLatestSpot, isoDate } from "@/lib/stooq";
import { classify, computeBands, interpretation } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FRESH_MS = 30 * 60 * 1000;
const HISTORY_DAYS = 365;

async function refreshLatest(force = false) {
  const latest = (await sql`
    SELECT snapshot_date, created_at
    FROM gsr_snapshots ORDER BY snapshot_date DESC LIMIT 1
  `) as Array<{ snapshot_date: string; created_at: string }>;

  if (!force && latest.length) {
    const age = Date.now() - new Date(latest[0].created_at).getTime();
    if (age < FRESH_MS) return;
  }

  const [g, s] = await Promise.all([
    fetchLatestSpot("xauusd"),
    fetchLatestSpot("xagusd"),
  ]);
  if (!g || !s || s.close <= 0) return;
  const today = isoDate(new Date());
  const ratio = g.close / s.close;
  await sql`
    INSERT INTO gsr_snapshots (snapshot_date, gold_usd, silver_usd, ratio, source)
    VALUES (${today}, ${g.close}, ${s.close}, ${ratio}, 'stooq-live')
    ON CONFLICT (snapshot_date) DO UPDATE
      SET gold_usd = EXCLUDED.gold_usd,
          silver_usd = EXCLUDED.silver_usd,
          ratio = EXCLUDED.ratio,
          source = EXCLUDED.source,
          created_at = NOW()
  `;
}

export async function GET(req: Request) {
  try {
    await ensureDb();
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    await refreshLatest(force);

    const cutoff = new Date(Date.now() - HISTORY_DAYS * 86400 * 1000)
      .toISOString()
      .slice(0, 10);
    const rows = (await sql`
      SELECT snapshot_date::text AS snapshot_date,
             gold_usd::float8 AS gold_usd,
             silver_usd::float8 AS silver_usd,
             ratio::float8 AS ratio,
             source
      FROM gsr_snapshots
      WHERE snapshot_date >= ${cutoff}::date
      ORDER BY snapshot_date ASC
    `) as Array<{
      snapshot_date: string;
      gold_usd: number;
      silver_usd: number;
      ratio: number;
      source: string;
    }>;

    if (!rows.length) {
      return NextResponse.json(
        { error: "no_data", message: "Spot feed warming up. Retry /api/gsr?force=1 in a few seconds." },
        { status: 503 },
      );
    }

    const ratios = rows.map((r) => r.ratio);
    const bands = computeBands(ratios);
    const current = rows[rows.length - 1];
    const zone = classify(current.ratio, bands, rows.length);
    const reading = interpretation(zone, current.ratio, bands, rows.length);

    return NextResponse.json({
      asOf: current.snapshot_date,
      gold: current.gold_usd,
      silver: current.silver_usd,
      ratio: current.ratio,
      bands,
      zone,
      interpretation: reading,
      history: rows.map((r) => ({ date: r.snapshot_date, ratio: r.ratio })),
      sample: rows.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown_error";
    console.error("/api/gsr failed", e);
    return NextResponse.json({ error: "internal", message }, { status: 500 });
  }
}
