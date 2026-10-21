import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme-border bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-brand shadow-xs"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 hover:text-slate-900 transition-colors" />
      )}
    </button>
  );
};

export default ThemeToggle;
