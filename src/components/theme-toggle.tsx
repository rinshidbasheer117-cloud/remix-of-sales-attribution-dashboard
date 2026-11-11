import { Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

/** Glass capsule that glides along a curved corner track: day = top, night = right side. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const night = theme === 'dark';
  return (
    <div className="corner-toggle" data-night={night ? '' : undefined}>
      <span className="corner-track" aria-hidden />
      <button type="button" className="corner-capsule" onClick={toggle} role="switch" aria-checked={night} aria-label={night ? 'Switch to day theme' : 'Switch to night theme'}>
        <span className="corner-knob"><Sun className="size-4" /></span>
        <span className="corner-glow" aria-hidden />
      </button>
    </div>
  );
}
