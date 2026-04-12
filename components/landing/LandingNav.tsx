"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { BrandMark } from "@/components/landing/BrandMark";
import { navRevealVariants } from "@/components/landing/motion-variants";

export function LandingNav() {
  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navRevealVariants}
      className="fixed top-0 z-50 w-full border-b border-white/8 bg-[#07101ddd]/90"
      style={{ backdropFilter: "blur(24px)" }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 max-md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark size={40} gradientId="gm-bg-nav" variant="midnight" />
          <div className="min-w-0">
            <span className="landing-display block truncate text-2xl leading-none text-[#f6f1ea]">
              Galeria
            </span>
            <span className="block pt-1 text-[0.64rem] font-semibold uppercase tracking-[0.42em] text-[var(--landing-text-muted)]">
              Event Gallery Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden items-center gap-5 lg:flex">
            <Link href="#features" className="landing-nav-link rounded-full px-3 py-2 text-sm font-medium">
              Features
            </Link>
            <Link href="#how-it-works" className="landing-nav-link rounded-full px-3 py-2 text-sm font-medium">
              How It Works
            </Link>
            <Link href="#use-cases" className="landing-nav-link rounded-full px-3 py-2 text-sm font-medium">
              Use Cases
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="landing-button-ghost hidden rounded-full px-4 py-2.5 text-sm font-medium sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="landing-button-primary inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap"
            >
              Start free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
