import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

/**
 * Compact icon button that flips between dark and light themes.
 * Persists the choice via the ThemeProvider (localStorage).
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="btn-glass rounded-full p-2 flex items-center justify-center"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
