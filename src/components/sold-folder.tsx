import { useMemo, useState, type ReactNode } from 'react';
import { format, parseISO, startOfMonth, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Bike } from '@/hooks/use-workspace';
import { inRange, rangeLabel } from '@/lib/date-range';

export function SoldFolder({ bikes, renderCard }: { bikes: Bike[]; renderCard: (b: Bike, i: number) => ReactNode }) {
  const dates = useMemo(() => [...new Set(bikes.map(b => b.sold_date).filter(Boolean) as string[])].sort().reverse(), [bikes]);
  const [picked, setPicked] = useState<DateRange | undefined | null>(null);
  const latest = dates[0] ? parseISO(dates[0]) : undefined;
  const range = picked === null ? (latest ? { from: latest, to: latest } : undefined) : picked;
  const [open, setOpen] = useState(false);
  const shown = bikes.filter(b => inRange(b.sold_date, range));
  const soldDays = dates.map(d => parseISO(d));
  const today = new Date();
  const presets: [string, DateRange | undefined][] = [['Last 7 days', { from: subDays(today, 6), to: today }], ['Last 30 days', { from: subDays(today, 29), to: today }], ['This month', { from: startOfMonth(today), to: today }], ['All time', undefined]];
  const label = rangeLabel(range);
  return <div className="mg-wrap">
    <div className="mg-folder" data-open={open ? '' : undefined}>
      <div className="mg-back" />
      <div className="mg-peek">{shown.slice(0, 3).map((b, i) => <span key={b.id} style={{ ['--i' as string]: i, backgroundImage: (b.listingUrl ?? b.intakeUrl) ? `url(${b.listingUrl ?? b.intakeUrl})` : undefined }} />)}</div>
      <div className="mg-front">
        <div><div className="mg-title">Sold bikes</div><div className="mg-caption">{bikes.length ? `${label} · ${shown.length} bike${shown.length === 1 ? '' : 's'}` : 'No sales yet'}</div></div>
        <div className="mg-controls">
          <Popover><PopoverTrigger asChild><button type="button" className="mg-date" aria-label="Pick sold dates"><CalendarIcon className="size-4" />{range?.from ? rangeLabel(range, true) : 'All time'}</button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-wrap gap-1 border-b p-2">{presets.map(([n, r]) => <button key={n} type="button" className="rounded-full px-3 py-1 text-xs hover:bg-accent" onClick={() => setPicked(r)}>{n}</button>)}</div>
              <Calendar mode="range" numberOfMonths={2} selected={range} defaultMonth={range?.from} onSelect={r => setPicked(r)} modifiers={{ sold: soldDays }} modifiersClassNames={{ sold: 'font-bold underline' }} className="p-3 pointer-events-auto" />
            </PopoverContent></Popover>
          <button type="button" className="mg-key" aria-expanded={open} aria-label={open ? 'Close folder' : 'Expand sold bikes'} onClick={() => setOpen(o => !o)}><ChevronDown className="size-5" /></button>
        </div>
      </div>
    </div>
    {open && (shown.length ? <div className="mg-cards" key={label}>{shown.map((b, i) => renderCard(b, i))}</div> : <p className="text-sm text-muted-foreground">No bikes sold in this period.</p>)}
  </div>;
}
