"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
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
  "Custom event branding & themes",
  "Lucky draw with multiple prize tiers",
  "Photo challenges with prize claims",
  "QR code attendance tracking",
  "Photo reactions & comments",
  "Bulk photo export & download",
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
    <section className="py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingHeaderViewport}
            variants={fadeUpVariants}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              All inclusive
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              No hidden fees, no feature walls
            </h2>
            <p className="mt-5 text-lg text-stone-600 dark:text-gray-400">
              Every plan includes the full feature set. You only pay for scale.
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
                  className="flex items-start gap-3 rounded-xl p-2"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" />
                  <span className="text-[15px] text-stone-700 dark:text-gray-300">{feature}</span>
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
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-violet-200/35 via-purple-200/20 to-fuchsia-200/20 blur-2xl dark:from-violet-900/20 dark:via-purple-900/10 dark:to-fuchsia-900/10" />
            <div className="rounded-3xl border border-[#e5d8ca]/80 bg-[#fcf8f2] p-10 shadow-xl shadow-[#d8cab8]/30 dark:border-gray-800 dark:bg-gray-900">
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
                      className={`h-8 w-8 rounded-full ${color} ring-2 ring-white dark:ring-gray-900`}
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
              <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Ready to try it?</h3>
              <p className="mt-2 text-stone-600 dark:text-gray-400">
                Create an event, share the link, and watch the gallery fill itself.
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/auth/register"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  Create Your First Event
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/auth/login"
                  className="flex w-full items-center justify-center rounded-2xl border-2 border-[#ddd1c3] px-6 py-4 font-semibold text-stone-700 transition-all hover:border-[#cfbeab] hover:bg-[#f4ede4] dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  Sign In to Existing Account
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-stone-500 dark:text-gray-500">
                <Link
                  href="/auth/admin/login"
                  className="transition-colors hover:text-stone-700 dark:hover:text-gray-400"
                >
                  Admin Login
                </Link>
                <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
                <span>No credit card required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
