import { createFileRoute } from '@tanstack/react-router';
import { InventoryView } from '@/components/inventory-view';
import { pageHead } from '@/lib/commission';
export const Route=createFileRoute('/history')({head:()=>pageHead('Sold bike history','Completed bicycle sales, lifecycle records and commission allocations in AED.'),component:()=> <InventoryView view="history"/>});
