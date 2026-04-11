"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
  fadeUpSmallVariants,
  fadeUpVariants,
  heroBadgeVariants,
  heroWordVariants,
  staggerContainer,
} from "@/components/landing/motion-variants";

const TRUST_SIGNALS = [
  "No credit card required",
  "Free plan included",
  "Launch in under 10 minutes",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
        >
          <motion.div
            variants={heroBadgeVariants}
            className="landing-kicker mx-auto w-fit rounded-full px-4 py-2 text-[0.8125rem] font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--landing-mint)]" />
            Live event photo galleries
          </motion.div>

          <motion.h1
            variants={fadeUpVariants}
            className="landing-display mx-auto mt-8 max-w-3xl text-[2.5rem] leading-[1.08] text-[#f4efe7] sm:text-[3.5rem]"
          >
            Turn every guest into your
            <motion.span
              variants={heroWordVariants}
              className="block bg-[linear-gradient(135deg,#f4efe7_0%,#cabaff_45%,#88e3da_100%)] bg-clip-text text-transparent"
            >
              live event feed.
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--landing-text-soft)]"
          >
            One QR code. One branded gallery. Guests upload, you moderate,
            everyone sees the moments as they happen.
          </motion.p>

          <motion.div
            variants={fadeUpSmallVariants}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/auth/register"
              className="landing-button-primary group inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold"
            >
              Create your first event
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/auth/login"
              className="text-base font-medium text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)]"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.08)}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            {TRUST_SIGNALS.map((signal) => (
              <motion.span
                key={signal}
                variants={fadeUpSmallVariants}
                className="flex items-center gap-2 text-base text-[var(--landing-text-muted)]"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-[var(--landing-mint)]" />
                {signal}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUpSmallVariants}
            className="mx-auto mt-14 flex items-center justify-center gap-8 border-t border-white/8 pt-10"
          >
            <div className="flex items-center gap-3 text-[var(--landing-text-muted)]">
              <Camera className="h-5 w-5 text-[var(--landing-violet)]" />
              <span className="text-xl font-semibold text-[#f4efe7]">12k+</span>
              <span className="text-base">photos uploaded</span>
            </div>
            <span className="h-5 w-px bg-white/12" />
            <div className="flex items-center gap-3 text-[var(--landing-text-muted)]">
              <Users className="h-5 w-5 text-[var(--landing-mint)]" />
              <span className="text-xl font-semibold text-[#f4efe7]">400+</span>
              <span className="text-base">events hosted</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
