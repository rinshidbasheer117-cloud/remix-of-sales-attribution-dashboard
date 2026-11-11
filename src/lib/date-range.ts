import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const key = (d: Date) => format(d, 'yyyy-MM-dd');
/** True when an ISO sold date falls inside the range (inclusive). No range = all dates. */
export function inRange(iso: string | null | undefined, r: DateRange | undefined) {
  if (!iso) return false;
  if (!r?.from) return true;
  const to = r.to ?? r.from;
  return iso >= key(r.from) && iso <= key(to);
}
export function rangeLabel(r: DateRange | undefined, short = false) {
  if (!r?.from) return 'All time';
  const f = short ? 'd MMM' : 'd MMM yyyy';
  const to = r.to ?? r.from;
  return key(r.from) === key(to) ? format(r.from, f) : `${format(r.from, f)} – ${format(to, f)}`;
}
