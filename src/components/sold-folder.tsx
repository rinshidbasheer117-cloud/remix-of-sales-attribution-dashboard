import { useMemo, useState, type ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Bike } from '@/hooks/use-workspace';

export function SoldFolder({ bikes, renderCard }: { bikes: Bike[]; renderCard: (b: Bike, i: number) => ReactNode }) {
  const dates = useMemo(() => [...new Set(bikes.map(b => b.sold_date).filter(Boolean) as string[])].sort().reverse(), [bikes]);
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? dates[0] ?? null;
  const [open, setOpen] = useState(false);
  const shown = bikes.filter(b => b.sold_date === day);
  const soldDays = dates.map(d => parseISO(d));
  return <div className="mg-wrap">
    <div className="mg-folder" data-open={open ? '' : undefined}>
      <div className="mg-back" />
      <div className="mg-peek">{shown.slice(0, 3).map((b, i) => <span key={b.id} style={{ ['--i' as string]: i, backgroundImage: (b.listingUrl ?? b.intakeUrl) ? `url(${b.listingUrl ?? b.intakeUrl})` : undefined }} />)}</div>
      <div className="mg-front">
        <div><div className="mg-title">Sold bikes</div><div className="mg-caption">{day ? `${format(parseISO(day), 'd MMM yyyy')} · ${shown.length} bike${shown.length === 1 ? '' : 's'}` : 'No sales yet'}</div></div>
        <div className="mg-controls">
          <Popover><PopoverTrigger asChild><button type="button" className="mg-date" aria-label="Pick sold date"><CalendarIcon className="size-4" />{day ? format(parseISO(day), 'd MMM') : 'Date'}</button></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={day ? parseISO(day) : undefined} onSelect={d => { if (d) { setPicked(format(d, 'yyyy-MM-dd')); setOpen(false); } }} modifiers={{ sold: soldDays }} modifiersClassNames={{ sold: 'font-bold underline' }} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
          <button type="button" className="mg-key" aria-expanded={open} aria-label={open ? 'Close folder' : 'Expand sold bikes'} onClick={() => setOpen(o => !o)}><ChevronDown className="size-5" /></button>
        </div>
      </div>
    </div>
    {open && (shown.length ? <div className="mg-cards" key={day ?? ''}>{shown.map((b, i) => renderCard(b, i))}</div> : <p className="text-sm text-muted-foreground">No bikes sold on this date.</p>)}
  </div>;
}
