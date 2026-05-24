import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tables = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name
    `) as Array<{ table_name: string }>;

    const out: any[] = [];
    for (const t of tables) {
      const cols = (await sql`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name=${t.table_name} ORDER BY ordinal_position
      `) as Array<{ column_name: string; data_type: string }>;
      const cnt = (await sql.unsafe(`SELECT COUNT(*)::int AS n FROM "${t.table_name}"`)) as Array<{ n: number }>;
      out.push({ table: t.table_name, count: cnt[0]?.n ?? 0, cols });
    }
    return NextResponse.json({ tables: out });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
