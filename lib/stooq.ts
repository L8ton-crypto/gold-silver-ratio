// Spot feed. Stooq returns CSV; gold-api is JSON fallback for live.

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/csv,text/plain,*/*",
};

export type SpotRow = { date: string; close: number };

function parseCsvWithHeader(csv: string): SpotRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const closeIdx = header.indexOf("close");
  if (dateIdx === -1 || closeIdx === -1) return [];
  const rows: SpotRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const d = parts[dateIdx];
    const c = parseFloat(parts[closeIdx]);
    if (d && Number.isFinite(c) && c > 0) {
      rows.push({ date: d, close: c });
    }
  }
  return rows;
}

async function fetchGoldApi(metal: "XAU" | "XAG"): Promise<SpotRow | null> {
  try {
    const r = await fetch(`https://api.gold-api.com/price/${metal}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { price?: number; updatedAt?: string };
    if (!j.price || j.price <= 0) return null;
    const d = j.updatedAt ? new Date(j.updatedAt) : new Date();
    return { date: d.toISOString().slice(0, 10), close: j.price };
  } catch {
    return null;
  }
}

export async function fetchLatestSpot(
  symbol: "xauusd" | "xagusd",
): Promise<SpotRow | null> {
  // Stooq CSV with header
  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const csv = await res.text();
      const rows = parseCsvWithHeader(csv);
      if (rows.length) {
        const r = rows[rows.length - 1];
        // Normalise date YYYY-MM-DD; Stooq gives "2026-05-25"
        return { date: r.date, close: r.close };
      }
    }
  } catch {
    // fall through
  }
  // Fallback: gold-api.com (JSON, no auth)
  const metal = symbol === "xauusd" ? "XAU" : "XAG";
  return fetchGoldApi(metal);
}

export async function fetchHistory(
  symbol: "xauusd" | "xagusd",
  d1: string,
  d2: string,
): Promise<SpotRow[]> {
  const url = `https://stooq.com/q/d/l/?s=${symbol}&d1=${d1}&d2=${d2}&i=d`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const csv = await res.text();
    return parseCsvWithHeader(csv);
  } catch {
    return [];
  }
}

export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
