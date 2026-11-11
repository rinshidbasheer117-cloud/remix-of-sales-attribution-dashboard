import { describe, it, expect } from 'vitest';
import { inRange } from './date-range';
const r = { from: new Date(2026, 10, 10), to: new Date(2026, 11, 20) };
describe('sold date range', () => {
  it('includes Nov 10 and Dec 20 ends', () => { expect(inRange('2026-11-10', r)).toBe(true); expect(inRange('2026-12-20', r)).toBe(true); });
  it('excludes Nov 9 and Dec 21', () => { expect(inRange('2026-11-09', r)).toBe(false); expect(inRange('2026-12-21', r)).toBe(false); });
  it('single day when only start picked', () => { expect(inRange('2026-11-10', { from: r.from })).toBe(true); expect(inRange('2026-11-11', { from: r.from })).toBe(false); });
});
