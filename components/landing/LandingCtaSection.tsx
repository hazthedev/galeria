"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { LandingGlowCard } from "@/components/landing/LandingGlowCard";
import {
  fadeUpVariants,
  indexedFadeUpVariants,
  landingHeaderViewport,
  landingViewport,
} from "@/components/landing/motion-variants";

const INCLUDED = [
  "Unlimited events on every plan",
  "Photo moderation & custom branding",
  "Lucky draw, challenges & reactions",
  "QR attendance & bulk export",
];

const checklistVariants = indexedFadeUpVariants(0.06);

export function LandingCtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="relative"
        >
          <LandingGlowCard tone="violet" className="landing-panel relative overflow-hidden rounded-[2.25rem] p-8 text-center sm:p-12">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(177,140,255,0.16),transparent_60%)]" />

            <h2 className="landing-display relative text-[1.75rem] text-[#f4efe7] sm:text-[2.5rem]">
              Start with one event.
              <span className="block text-[var(--landing-text-soft)]">
                Keep the whole system when you grow.
              </span>
            </h2>

            <p className="relative mt-4 text-base leading-relaxed text-[var(--landing-text-soft)]">
              The free plan is the real product, not a stripped-down teaser.
            </p>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((feature, index) => (
                <motion.div
                  key={feature}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={landingViewport}
                  variants={checklistVariants}
                  className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.03] px-4 py-3 text-left"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--landing-mint)]" />
                  <span className="text-base text-[var(--landing-text-soft)]">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="relative mt-10">
              <Link
                href="/auth/register"
                className="landing-button-primary group inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold"
              >
                Create your first event
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <p className="relative mt-4 text-base text-[var(--landing-text-muted)]">
              No credit card required
            </p>
          </LandingGlowCard>
        </motion.div>
      </div>
    </section>
  );
}
