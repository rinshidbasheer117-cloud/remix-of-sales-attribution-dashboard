export type CommissionInput = { profit: number; days: number; closer: string; appointment?: string | null; procurer: string; sourcingAssistant?: string | null; eligible: string[] };
export function commissionRates(days: number) {
  if (!Number.isInteger(days) || days < 0) throw new Error('Invalid stock age');
  return days <= 30 ? { zone: 'Green', sales: .05, procurement: .15, pool: .05 } : days <= 60 ? { zone: 'Yellow', sales: .1, procurement: .1, pool: .05 } : { zone: 'Red', sales: .15, procurement: .05, pool: .05 };
}
export function calculateCommission(input: CommissionInput) {
  const rates = commissionRates(input.days);
  const profit = Math.max(0, input.profit);
  const rows: { employee: string; role: string; amount: number }[] = [];
  const split = (amount: number, person: string, assistant: string | null | undefined, role: string) => {
    if (assistant && assistant !== person) { rows.push({ employee: person, role, amount: amount / 2 }, { employee: assistant, role: role === 'Sales' ? 'Appointment' : 'Sourcing support', amount: amount / 2 }); }
    else rows.push({ employee: person, role, amount });
  };
  split(profit * rates.sales, input.closer, input.appointment, 'Sales');
  split(profit * rates.procurement, input.procurer, input.sourcingAssistant, 'Procurement');
  const direct = new Set(rows.map(r => r.employee));
  const pool = [...new Set(input.eligible)].filter(id => !direct.has(id));
  const cents = Math.round(profit * rates.pool * 100);
  pool.forEach((employee, i) => rows.push({ employee, role: 'Staff pool', amount: (Math.floor(cents / pool.length) + (i < cents % pool.length ? 1 : 0)) / 100 }));
  return { rates, rows, unallocatedPool: pool.length ? 0 : profit * rates.pool };
}
export const aed = (value: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 2 }).format(value);
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const stockDays = (purchase: string, end: string) => Math.round((Date.parse(end) - Date.parse(purchase)) / 86400000);
export const pageHead = (name: string, description: string) => ({ meta: [{ title: `${name} · CycleWorks` }, { name: 'description', content: description }, { property: 'og:title', content: `${name} · CycleWorks` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] });