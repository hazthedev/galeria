"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Star } from "lucide-react";
import { motion } from "motion/react";
import {
  fadeUpVariants,
  indexedFadeUpVariants,
  indexedPopVariants,
  landingHeaderViewport,
  landingViewport,
  slideInRightVariants,
} from "@/components/landing/motion-variants";

const INCLUDED_FEATURES = [
  "Unlimited events on every plan",
  "Manual photo moderation",
  "Custom event branding and themes",
  "Lucky draw with multiple prize tiers",
  "Photo challenges with prize claims",
  "QR code attendance tracking",
  "Photo reactions and comments",
  "Bulk photo export and download",
  "Real-time photo gallery",
  "Mobile-optimized guest experience",
];

const REVIEW_BADGES = [
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-indigo-500",
];

const checklistItemVariants = indexedFadeUpVariants(0.05);
const avatarVariants = indexedPopVariants(0.08);
const starVariants = indexedPopVariants(0.06, REVIEW_BADGES.length * 0.08 + 0.12);

export function LandingCtaSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="landing-panel relative overflow-hidden rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(177,140,255,0.18),transparent_60%)]" />
          <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={landingHeaderViewport}
              variants={fadeUpVariants}
            >
              <p className="landing-kicker w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold">
                Start now
              </p>
              <h2 className="landing-display mt-6 text-4xl text-[#f4efe7] sm:text-6xl">
                Start with one event.
                <span className="block text-[var(--landing-text-soft)]">
                  Keep the whole system when you grow.
                </span>
              </h2>
              <p className="mt-5 text-lg leading-8 text-[var(--landing-text-soft)]">
                The self-serve path is the product, not a stripped-down teaser. Create the event,
                publish the gallery, and operate it with the same tools you will use at larger scale.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {INCLUDED_FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={landingViewport}
                    variants={checklistItemVariants}
                    className="flex items-start gap-3 rounded-2xl border border-white/7 bg-white/[0.03] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-mint)]" />
                    <span className="text-[15px] leading-6 text-[var(--landing-text-soft)]">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              variants={slideInRightVariants}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 rounded-[32px] bg-[radial-gradient(circle,rgba(177,140,255,0.16),transparent_60%)] blur-2xl" />
              <div className="landing-panel-soft rounded-[2rem] p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {REVIEW_BADGES.map((color, index) => (
                      <motion.div
                        key={`${color}-${index}`}
                        custom={index}
                        initial="hidden"
                        whileInView="visible"
                        viewport={landingViewport}
                        variants={avatarVariants}
                        className={`h-8 w-8 rounded-full ${color} ring-2 ring-[#08111d]`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <motion.div
                        key={index}
                        custom={index}
                        initial="hidden"
                        whileInView="visible"
                        viewport={landingViewport}
                        variants={starVariants}
                      >
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <h3 className="mt-6 text-3xl font-semibold text-[#f4efe7]">Ready to launch your first room?</h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--landing-text-soft)]">
                  Create an event, share the link, and let the gallery start working as soon as guests arrive.
                </p>

                <div className="mt-8 space-y-3">
                  <Link
                    href="/auth/register"
                    className="landing-button-primary group flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold"
                  >
                    Create Your First Event
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="landing-button-secondary flex w-full items-center justify-center rounded-full px-6 py-4 font-semibold"
                  >
                    Sign In to Existing Account
                  </Link>
                </div>

                <div className="landing-rule mt-6 pt-6">
                  <div className="flex items-center gap-3 text-sm text-[var(--landing-text-soft)]">
                    <Shield className="h-4 w-4 text-[var(--landing-mint)]" />
                    <span>Admin access stays available when you need system-wide support.</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[var(--landing-text-muted)]">
                  <Link href="/auth/admin/login" className="landing-utility-link">
                    Admin Login
                  </Link>
                  <span className="h-3 w-px bg-white/12" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
