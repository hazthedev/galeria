"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Image,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  fadeUpSmallVariants,
  fadeUpVariants,
  heroBadgeVariants,
  heroWordVariants,
  staggerContainer,
  statListVariants,
} from "@/components/landing/motion-variants";

type HeroStat = {
  icon: LucideIcon;
  title: string;
  label: string;
  bgClassName: string;
  iconClassName: string;
};

const HERO_STATS: HeroStat[] = [
  {
    icon: Image,
    title: "Real-time",
    label: "Photo Gallery",
    bgClassName: "bg-violet-100 dark:bg-violet-900/30",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Zap,
    title: "Instant",
    label: "QR Upload",
    bgClassName: "bg-purple-100 dark:bg-purple-900/30",
    iconClassName: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Heart,
    title: "Photo",
    label: "Reactions",
    bgClassName: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    iconClassName: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    icon: Users,
    title: "Multi",
    label: "Tenant SaaS",
    bgClassName: "bg-indigo-100 dark:bg-indigo-900/30",
    iconClassName: "text-indigo-600 dark:text-indigo-400",
  },
];

const TRUST_SIGNALS = [
  "No credit card required",
  "Free plan included",
  "Cancel anytime",
];

export function HeroSection() {
  return (
    <section className="relative pb-24 pt-32 sm:pb-36 sm:pt-44">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-br from-violet-200/50 via-purple-100/40 to-transparent blur-3xl dark:from-violet-900/25 dark:via-purple-900/15" />
        <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-purple-100/50 to-transparent blur-3xl dark:from-purple-900/15" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-3xl dark:from-violet-900/15" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.015)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            variants={heroBadgeVariants}
            className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-4 py-1.5 text-sm font-medium text-violet-700 backdrop-blur-sm dark:border-violet-800/40 dark:bg-violet-950/50 dark:text-violet-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Event Photo Platform</span>
          </motion.div>

          <motion.h1
            variants={fadeUpVariants}
            className="mt-8 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl sm:leading-[1.1]"
          >
            Capture Moments,{" "}
            <motion.span className="relative" variants={heroWordVariants}>
              <motion.span className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Together
              </motion.span>
              <svg
                aria-hidden="true"
                className="absolute -bottom-2 left-0 w-full"
                fill="none"
                viewBox="0 0 300 12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C50 2.5 100 2 150 5.5C200 9 250 4 298 7"
                  stroke="url(#paint)"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <defs>
                  <linearGradient id="paint" x1="2" x2="298" y1="6" y2="6">
                    <stop stopColor="#8B5CF6" />
                    <stop offset="0.5" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 sm:text-xl"
          >
            One link. Every guest&apos;s camera. A live gallery that fills itself
            {" "}with built-in lucky draws, photo challenges, and instant sharing.
          </motion.p>

          <motion.div
            variants={staggerContainer(0.12)}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div variants={fadeUpSmallVariants}>
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/30"
              >
                <span>Create Your First Event</span>
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 opacity-40 blur-xl transition-opacity group-hover:opacity-60" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUpSmallVariants}>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white/80 px-8 py-4 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-white"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer(0.08)}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400 dark:text-gray-500"
          >
            {TRUST_SIGNALS.map((signal) => (
              <motion.span key={signal} variants={fadeUpSmallVariants} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                {signal}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <div className="mx-auto mt-20 max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="relative rounded-3xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-1 shadow-2xl shadow-gray-200/50 dark:border-gray-800/80 dark:from-gray-900 dark:to-gray-950 dark:shadow-none"
          >
            <div className="rounded-[20px] border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900/50">
              <motion.div
                variants={statListVariants(0.1)}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-6 sm:grid-cols-4"
              >
                {HERO_STATS.map((stat) => (
                  <motion.div key={stat.label} variants={fadeUpSmallVariants} className="text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bgClassName}`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.iconClassName}`} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{stat.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
