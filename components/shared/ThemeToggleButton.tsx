// ============================================
// Shared theme toggle button
// ============================================

'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import {
  applyTheme,
  getPreferredTheme,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/shared/theme';

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const syncTheme = () => {
      const nextTheme = getPreferredTheme();
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    syncTheme();

    const handleSystemThemeChange = () => {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        syncTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={themeLabel}
      title={themeLabel}
      className={clsx(
        'inline-flex min-h-11 w-11 items-center justify-center rounded-xl border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
