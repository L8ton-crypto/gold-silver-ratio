// Stooq spot feed for gold (xauusd) and silver (xagusd), USD per oz.
// Proven path from SpotPremium task-118 - Yahoo blocks Vercel egress IPs.

const STOOQ_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "text/csv,text/plain,*/*",
};

export type SpotRow = { date: string; close: number };

function parseCsv(csv: string): SpotRow[] {
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

export async function fetchLatestSpot(
  symbol: "xauusd" | "xagusd",
): Promise<SpotRow | null> {
  // Daily endpoint returns the most recent close as last row.
  const url = `https://stooq.com/q/l/?s=${symbol}&i=d`;
  try {
    const res = await fetch(url, {
      headers: STOOQ_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const csv = await res.text();
    const rows = parseCsv(csv);
    return rows.length ? rows[rows.length - 1] : null;
  } catch (e) {
    console.error(`stooq latest fetch failed for ${symbol}`, e);
    return null;
  }
}

export async function fetchHistory(
  symbol: "xauusd" | "xagusd",
  d1: string,
  d2: string,
): Promise<SpotRow[]> {
  // d1, d2 in YYYYMMDD form
  const url = `https://stooq.com/q/d/l/?s=${symbol}&d1=${d1}&d2=${d2}&i=d`;
  try {
    const res = await fetch(url, {
      headers: STOOQ_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const csv = await res.text();
    return parseCsv(csv);
  } catch (e) {
    console.error(`stooq history fetch failed for ${symbol}`, e);
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
