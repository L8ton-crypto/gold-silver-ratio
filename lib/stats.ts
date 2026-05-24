export type Bands = {
  mean: number;
  std: number;
  plus1: number;
  minus1: number;
  plus2: number;
  minus2: number;
  min: number;
  max: number;
};

export function computeBands(values: number[]): Bands {
  if (!values.length) {
    return { mean: 0, std: 0, plus1: 0, minus1: 0, plus2: 0, minus2: 0, min: 0, max: 0 };
  }
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    plus1: mean + std,
    minus1: mean - std,
    plus2: mean + 2 * std,
    minus2: mean - 2 * std,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export type Zone = "extreme-high" | "high" | "normal" | "low" | "extreme-low" | "bootstrap";

export const MIN_SAMPLE = 14;

export function classify(current: number, bands: Bands, sample: number): Zone {
  if (sample < MIN_SAMPLE || bands.std === 0) return "bootstrap";
  if (current >= bands.plus2) return "extreme-high";
  if (current >= bands.plus1) return "high";
  if (current <= bands.minus2) return "extreme-low";
  if (current <= bands.minus1) return "low";
  return "normal";
}

export function interpretation(zone: Zone, current: number, bands: Bands, sample: number): string {
  if (zone === "bootstrap") {
    return `Trailing band is still bootstrapping. Need ${MIN_SAMPLE - sample} more daily snapshot${MIN_SAMPLE - sample === 1 ? "" : "s"} before the +/- sigma read is meaningful. Cron runs daily at 06:00 UTC.`;
  }
  const sigma = bands.std > 0 ? ((current - bands.mean) / bands.std).toFixed(2) : "0";
  switch (zone) {
    case "extreme-high":
      return `Ratio is ${sigma} sigma above the trailing mean. Silver looks historically very cheap relative to gold. Mean reversion bias: long silver, short gold.`;
    case "high":
      return `Ratio is ${sigma} sigma above the trailing mean. Silver looks cheap vs gold. Watch for confirmation before sizing in.`;
    case "extreme-low":
      return `Ratio is ${sigma} sigma below the trailing mean. Silver looks historically expensive vs gold. Mean reversion bias: long gold, short silver.`;
    case "low":
      return `Ratio is ${sigma} sigma below the trailing mean. Silver looks rich vs gold. Watch for confirmation.`;
    default:
      return `Ratio is ${sigma} sigma from the trailing mean. No edge from this signal alone. Wait for a band touch.`;
  }
}
