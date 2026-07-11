import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  const isDark = colorMode === 'dark';

  return (
    <button
      onClick={toggleColorMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
    >
      <span className="relative block w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </span>
    </button>
  );
}
