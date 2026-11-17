import type { ChannelMetrics } from "./attribution";

/** Interpolate panel data while preserving the conversion and revenue totals. */
export function interpolateModelData(
  from: ChannelMetrics[],
  to: ChannelMetrics[],
  progress: number,
): ChannelMetrics[] {
  const t = Math.min(1, Math.max(0, progress));
  const mixed = to.map((target, index) => {
    const source = from[index];
    const mix = (a: number, b: number) =>
      Number.isFinite(a) && Number.isFinite(b) ? a + (b - a) * t : b;
    return {
      ...target,
      share: mix(source.share, target.share),
      revenue: mix(source.revenue, target.revenue),
      conversions: mix(source.conversions, target.conversions),
      roas: mix(source.roas, target.roas),
      cpa: mix(source.cpa, target.cpa),
      trend: target.trend.map((point, week) => mix(source.trend[week], point)),
    };
  });

  const total = Math.round(from.reduce((sum, row) => sum + row.conversions, 0));
  const floors = mixed.map((row) => Math.floor(row.conversions));
  let remaining = total - floors.reduce((sum, value) => sum + value, 0);
  const order = mixed
    .map((row, index) => ({ index, fraction: row.conversions - floors[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const { index } of order) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }

  return mixed.map((row, index) => ({ ...row, conversions: floors[index] }));
}
