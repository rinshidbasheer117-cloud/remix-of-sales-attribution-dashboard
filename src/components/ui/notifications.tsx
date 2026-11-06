import { Toaster } from 'sileo';

export function Notifications() {
  return <Toaster position="top-center" theme="light" options={{
    fill: 'var(--card)',
    duration: 5000,
    styles: { title: 'text-foreground', description: 'text-muted-foreground' },
  }} />;
}