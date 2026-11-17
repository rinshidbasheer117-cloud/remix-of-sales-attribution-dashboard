import { describe, expect, it } from "vitest";
import { getModelData, QUARTER } from "./attribution";
import { interpolateModelData } from "./transition";

describe("model transition snapshots", () => {
  it("keeps revenue and conversion totals conserved at every animation step", () => {
    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      const rows = interpolateModelData(getModelData("first"), getModelData("last"), t);
      expect(rows.reduce((sum, row) => sum + row.conversions, 0)).toBe(QUARTER.totalConversions);
      expect(rows.reduce((sum, row) => sum + row.revenue, 0)).toBeCloseTo(QUARTER.totalRevenue, 6);
    }
  });
});
