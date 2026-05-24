import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Throwing at module import would crash build. Guard at call site instead.
  console.warn("DATABASE_URL is not set. ensureDb() will throw at first use.");
}

export const sql = neon(connectionString ?? "postgres://placeholder");

let initialised = false;

export async function ensureDb() {
  if (initialised) return;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  await sql`
    CREATE TABLE IF NOT EXISTS gsr_snapshots (
      snapshot_date DATE PRIMARY KEY,
      gold_usd NUMERIC(12,2) NOT NULL,
      silver_usd NUMERIC(12,4) NOT NULL,
      ratio NUMERIC(10,2) NOT NULL,
      source TEXT NOT NULL DEFAULT 'stooq',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS gsr_snapshots_date_idx ON gsr_snapshots (snapshot_date DESC)`;
  initialised = true;
}

export type GsrRow = {
  snapshot_date: string;
  gold_usd: number;
  silver_usd: number;
  ratio: number;
  source: string;
};
