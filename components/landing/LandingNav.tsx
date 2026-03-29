"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { BrandMark } from "@/components/landing/BrandMark";
import { navRevealVariants } from "@/components/landing/motion-variants";
import { ThemeToggleButton } from "@/components/shared/ThemeToggleButton";

export function LandingNav() {
  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navRevealVariants}
      className="fixed top-0 z-50 w-full border-b border-[#e6dbcf]/80 bg-[#f6f1ea]/88 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/80"
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
            <ThemeToggleButton className="border-[#dfd2c3]/80 bg-[#fcf8f2]/90 text-stone-600 shadow-sm hover:border-[#d4c4b3] hover:text-slate-900 dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:text-white" />
            <Link
              href="/auth/login"
              className="hidden items-center rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white sm:inline-flex"
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
