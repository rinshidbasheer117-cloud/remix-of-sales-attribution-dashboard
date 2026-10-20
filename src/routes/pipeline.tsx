import { createFileRoute } from '@tanstack/react-router';
import { InventoryView } from '@/components/inventory-view';
import { pageHead } from '@/lib/commission';
export const Route=createFileRoute('/pipeline')({head:()=>pageHead('Workshop pipeline','Track bicycle procurement, service, inspection and listing in Dubai.'),component:()=> <InventoryView view="pipeline"/>});
