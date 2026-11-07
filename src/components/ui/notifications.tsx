import { Toaster } from 'sileo';
import { ClientOnly } from '@tanstack/react-router';

export function Notifications() {
  return <ClientOnly><Toaster position="top-center" theme="light" options={{
    fill: 'var(--card)',
    duration: 5000,
    styles: { title: 'text-foreground', description: 'text-muted-foreground' },
  }} /></ClientOnly>;
}