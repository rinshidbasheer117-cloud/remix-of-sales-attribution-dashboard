import { describe, it, expect } from 'vitest';
import { calculateCommission, commissionRates, stockDays } from './commission';
describe('commission policy', () => {
  it('green includes day 30 and pays sales 5%, procurement 15%, pool 5%', () => { expect(commissionRates(30)).toEqual({ zone: 'Green', sales: .05, procurement: .15, pool: .05 }); });
  it('yellow starts day 31 and includes day 60 at 10% / 10% / 5%', () => { expect(commissionRates(31)).toEqual({ zone: 'Yellow', sales: .1, procurement: .1, pool: .05 }); expect(commissionRates(60)).toEqual(commissionRates(31)); });
  it('red starts day 61 at 15% / 5% / 5%', () => { expect(commissionRates(61)).toEqual({ zone: 'Red', sales: .15, procurement: .05, pool: .05 }); });
  const base = { profit: 1000, days: 20, closer: 'Arbaz', procurer: 'Anaz', eligible: ['Ernest', 'Aron', 'Sulaiman', 'Khalid', 'Arbaz', 'Anaz'] };
  it('divides AED 50 equally among four uninvolved staff, excluding direct contributors', () => { const result = calculateCommission(base); expect(result.rows.filter(r => r.role === 'Staff pool').map(r => r.amount)).toEqual([12.5, 12.5, 12.5, 12.5]); expect(result.rows.find(r => r.employee === 'Arbaz')?.amount).toBe(50); expect(result.rows.find(r => r.employee === 'Anaz')?.amount).toBe(150); });
  it('splits appointments equally and excludes appointment maker from staff pool', () => { const result = calculateCommission({ ...base, closer: 'Ernest', appointment: 'Arbaz' }); expect(result.rows.find(r => r.role === 'Sales')?.amount).toBe(25); expect(result.rows.find(r => r.role === 'Appointment')?.amount).toBe(25); expect(result.rows.filter(r => r.role === 'Staff pool').map(r => r.employee)).toEqual(['Aron', 'Sulaiman', 'Khalid']); });
  it('splits procurement equally with sourcing support', () => { const result = calculateCommission({ ...base, sourcingAssistant: 'Khalid' }); expect(result.rows.find(r => r.role === 'Procurement')?.amount).toBe(75); expect(result.rows.find(r => r.role === 'Sourcing support')?.amount).toBe(75); });
  it('does not pay commissions on a loss', () => { expect(calculateCommission({ ...base, profit: -100 }).rows.every(r => r.amount === 0)).toBe(true); });
  it('preserves AED 50 pool total after cent rounding', () => { expect(calculateCommission({ ...base, eligible: ['Aron', 'Khalid', 'Sulaiman'] }).rows.filter(r => r.role === 'Staff pool').reduce((n, r) => n + Math.round(r.amount * 100), 0)).toBe(5000); });
  it('counts stock age from purchase to sale date', () => { expect(stockDays('2026-09-18', '2026-10-18')).toBe(30); });
});