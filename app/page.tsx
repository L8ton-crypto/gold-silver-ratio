import RatioChart from "@/components/RatioChart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Bands = {
  mean: number;
  std: number;
  plus1: number;
  minus1: number;
  plus2: number;
  minus2: number;
  min: number;
  max: number;
};

type GsrResponse = {
  asOf: string;
  gold: number;
  silver: number;
  ratio: number;
  bands: Bands;
  zone: "extreme-high" | "high" | "normal" | "low" | "extreme-low" | "bootstrap";
  interpretation: string;
  history: { date: string; ratio: number }[];
  sample: number;
};

async function getGsr(): Promise<GsrResponse | { error: string }> {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/gsr`, { cache: "no-store" });
    if (!res.ok) return { error: `api_${res.status}` };
    return (await res.json()) as GsrResponse;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "fetch_failed" };
  }
}

function zoneStyles(zone: string) {
  switch (zone) {
    case "extreme-high":
      return { label: "Silver extremely cheap", color: "text-emerald-400", chip: "bg-emerald-500/15 border-emerald-500/40" };
    case "high":
      return { label: "Silver cheap", color: "text-emerald-300", chip: "bg-emerald-500/10 border-emerald-500/30" };
    case "extreme-low":
      return { label: "Silver extremely rich", color: "text-rose-400", chip: "bg-rose-500/15 border-rose-500/40" };
    case "low":
      return { label: "Silver rich", color: "text-rose-300", chip: "bg-rose-500/10 border-rose-500/30" };
    case "bootstrap":
      return { label: "Building trailing band", color: "text-amber-300", chip: "bg-amber-500/10 border-amber-500/30" };
    default:
      return { label: "Neutral zone", color: "text-neutral-300", chip: "bg-neutral-700/30 border-neutral-600/50" };
  }
}

export default async function Page() {
  const data = await getGsr();

  if ("error" in data) {
    return (
      <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4">GoldSilverRatio</h1>
        <p className="text-rose-400">
          Spot feed warming up. Refresh in a few seconds, or hit{" "}
          <a href="/api/gsr?force=1" className="underline">/api/gsr?force=1</a> to force a fresh pull.
        </p>
        <p className="mt-4 text-neutral-500 text-sm">Reason: {data.error}</p>
      </main>
    );
  }

  const zs = zoneStyles(data.zone);
  const isBootstrap = data.zone === "bootstrap";
  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Live gold/silver ratio - {data.asOf}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">
            Is silver actually cheap?
          </h1>
          <p className="mt-2 text-neutral-400 max-w-2xl">
            One number, trailing context. Above the band is mean-reversion territory for silver longs. Below the band, the opposite.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-xs uppercase tracking-widest text-neutral-500">Gold</div>
            <div className="mt-1 text-2xl font-semibold text-gold">
              ${data.gold.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500">USD per oz</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-xs uppercase tracking-widest text-neutral-500">Silver</div>
            <div className="mt-1 text-2xl font-semibold text-silver">
              ${data.silver.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-500">USD per oz</div>
          </div>
          <div className={`rounded-xl border p-5 ${zs.chip}`}>
            <div className="text-xs uppercase tracking-widest text-neutral-500">Ratio</div>
            <div className={`mt-1 text-3xl font-semibold ${zs.color}`}>
              {data.ratio.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-400">{zs.label}</div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 mb-8">
          <div className="text-sm text-neutral-300 leading-relaxed">{data.interpretation}</div>
          <div className="mt-3 text-xs text-neutral-500">
            Sample {data.sample} day{data.sample === 1 ? "" : "s"}
            {!isBootstrap && (
              <>
                {" - "}mean {data.bands.mean.toFixed(2)} - sigma {data.bands.std.toFixed(2)} - low {data.bands.min.toFixed(2)} - high {data.bands.max.toFixed(2)}
              </>
            )}
          </div>
        </section>

        {!isBootstrap && (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 sm:p-5 mb-10">
            <RatioChart
              history={data.history}
              mean={data.bands.mean}
              plus1={data.bands.plus1}
              minus1={data.bands.minus1}
              plus2={data.bands.plus2}
              minus2={data.bands.minus2}
            />
          </section>
        )}

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 mb-10 text-sm text-neutral-400 leading-relaxed">
          <h2 className="text-neutral-200 font-semibold mb-2">How to read this</h2>
          <p className="mb-2">The gold/silver ratio is the dollar price of gold divided by the dollar price of silver. It tells you how many ounces of silver one ounce of gold buys. Long-run, that ratio mean-reverts.</p>
          <p className="mb-2">Above the +1 sigma band, silver looks historically cheap relative to gold. Above +2 sigma is a stronger signal but rare and worth fading with risk. Below -1 sigma flips the read.</p>
          <p>This tracker accumulates a fresh daily snapshot via cron at 06:00 UTC. The trailing band becomes statistically meaningful after ~14 days. Pair it with your own risk-per-trade rule. No financial advice.</p>
        </section>

        <footer className="text-xs text-neutral-500 pb-10">
          Data: Stooq spot + gold-api.com fallback - cached 30 min - daily snapshot 06:00 UTC.
          <span className="mx-2">|</span>
          <a className="underline hover:text-neutral-300" href="/api/gsr">/api/gsr</a>
          <span className="mx-2">|</span>
          <a className="underline hover:text-neutral-300" href="/api/gsr?force=1">force refresh</a>
        </footer>
      </div>
    </main>
  );
}
