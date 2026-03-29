"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { BrandMark } from "@/components/landing/BrandMark";
import { navRevealVariants } from "@/components/landing/motion-variants";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "galeria-theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function getPreferredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function LandingNav() {
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

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navRevealVariants}
      className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={36} gradientId="gm-bg-nav" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Galeria</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="#proof"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Proof
            </Link>
            <Link
              href="#use-cases"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Use Cases
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200/80 bg-white/90 text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:text-white"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <Link
              href="/auth/login"
              className="hidden items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
