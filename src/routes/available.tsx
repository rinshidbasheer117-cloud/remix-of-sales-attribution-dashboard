import { createFileRoute } from '@tanstack/react-router';
import { InventoryView } from '@/components/inventory-view';
import { pageHead } from '@/lib/commission';
export const Route=createFileRoute('/available')({head:()=>pageHead('Available bikes','Premium pre-owned bicycles, prepared for sale with procurement and service records.'),component:()=> <InventoryView view="available"/>});
