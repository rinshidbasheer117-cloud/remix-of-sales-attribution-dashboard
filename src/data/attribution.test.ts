import { describe, expect, it } from "vitest";
import { CHANNELS, MODELS, QUARTER, getModelData } from "./attribution";

describe("attribution model invariants", () => {
  it("conserves quarter conversions and revenue under every model", () => {
    for (const { id } of MODELS) {
      const rows = getModelData(id);
      expect(rows.reduce((sum, row) => sum + row.conversions, 0)).toBe(QUARTER.totalConversions);
      expect(rows.reduce((sum, row) => sum + row.revenue, 0)).toBeCloseTo(QUARTER.totalRevenue, 6);
    }
  });

  it("keeps every channel and its twelve trend points in every model", () => {
    for (const { id } of MODELS) {
      const rows = getModelData(id);
      expect(rows.map((row) => row.id)).toEqual(CHANNELS.map((channel) => channel.id));
      expect(rows.every((row) => row.trend.length === 12)).toBe(true);
    }
  });

  it("changes channel credit across attribution models", () => {
    const first = getModelData("first");
    const linear = getModelData("linear");
    const last = getModelData("last");
    expect(
      first.some((row, i) => row.share !== linear[i].share || row.share !== last[i].share),
    ).toBe(true);
  });

  it("derives the displayed average of 4.2 touchpoints", () => {
    expect(Number(QUARTER.avgTouchpoints.toFixed(1))).toBe(4.2);
  });
});
