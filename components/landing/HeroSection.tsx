"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Command,
  FolderKanban,
  ImageIcon,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
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

type HeroMetric = {
  icon: LucideIcon;
  value: string;
  label: string;
  tone: "signal" | "mint" | "gold";
};

const HERO_METRICS: HeroMetric[] = [
  {
    icon: ImageIcon,
    value: "1,842",
    label: "Photos flowing through the gallery",
    tone: "signal",
  },
  {
    icon: QrCode,
    value: "642",
    label: "Guests in the live QR upload path",
    tone: "mint",
  },
  {
    icon: ShieldCheck,
    value: "27 s",
    label: "Typical moderation-to-live handoff",
    tone: "gold",
  },
];

const TRUST_SIGNALS = [
  "No credit card required",
  "Free plan included",
  "Launch your first event in minutes",
];

const OPERATOR_FEED = [
  {
    icon: FolderKanban,
    title: "Aish Wedding",
    detail: "Moderation queue clear. Challenge running.",
  },
  {
    icon: Clock3,
    title: "Ballroom check-in",
    detail: "Attendance spike detected in the last 10 minutes.",
  },
  {
    icon: Users,
    title: "Guest engagement",
    detail: "Draw threshold reached. Ready to announce winners.",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-32 sm:pt-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.12)}
            className="relative max-w-3xl"
          >
            <motion.div
              variants={heroBadgeVariants}
              className="landing-kicker w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--landing-mint)]" />
              Public gallery orchestration
            </motion.div>

            <motion.h1
              variants={fadeUpVariants}
              className="landing-display mt-8 text-5xl leading-none text-[#f4efe7] sm:text-7xl xl:text-[5.25rem]"
            >
              Turn every guest
              <motion.span
                variants={heroWordVariants}
                className="block bg-[linear-gradient(135deg,#f4efe7_0%,#cabaff_45%,#88e3da_100%)] bg-clip-text text-transparent"
              >
                into your live event feed.
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUpVariants}
              className="mt-8 max-w-2xl text-lg leading-8 text-[var(--landing-text-soft)] sm:text-xl"
            >
              Galeria gives you one guest-friendly QR flow, one branded gallery, and one
              operating surface for uploads, moderation, challenges, and post-event delivery.
            </motion.p>

            <motion.div
              variants={staggerContainer(0.1)}
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
            >
              <motion.div variants={fadeUpSmallVariants}>
                <Link
                  href="/auth/register"
                  className="landing-button-primary group inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-base font-semibold"
                >
                  Create your first event
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div variants={fadeUpSmallVariants}>
                <Link
                  href="/auth/login"
                  className="landing-button-secondary inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold"
                >
                  Sign in
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={staggerContainer(0.08)}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--landing-text-muted)]"
            >
              {TRUST_SIGNALS.map((signal) => (
                <motion.span key={signal} variants={fadeUpSmallVariants} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--landing-mint)]" />
                  {signal}
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUpSmallVariants}
              className="landing-rule landing-glow-line mt-12 grid gap-5 pt-8 sm:grid-cols-3"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--landing-text-muted)]">
                  Guest flow
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--landing-text-soft)]">
                  Scan, upload, react, and enter draws without downloading anything.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--landing-text-muted)]">
                  Organizer view
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--landing-text-soft)]">
                  Brand controls, moderation, attendance, and support signals in one place.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--landing-text-muted)]">
                  After the event
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--landing-text-soft)]">
                  Export galleries, review activity, and keep every moment searchable.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="landing-panel rounded-[2rem] p-4 sm:p-5"
          >
            <div className="rounded-[1.6rem] border border-white/8 bg-[rgba(4,9,20,0.58)] p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--landing-text-muted)]">
                    Tonight&apos;s control snapshot
                  </p>
                  <h2 className="landing-display mt-3 text-4xl text-[#f4efe7]">A gallery with teeth.</h2>
                </div>
                <span
                  className="landing-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                  data-tone="mint"
                >
                  Live now
                </span>
              </div>

              <motion.div
                variants={statListVariants(0.1)}
                initial="hidden"
                animate="visible"
                className="mt-8 grid gap-3 sm:grid-cols-3"
              >
                {HERO_METRICS.map((metric) => (
                  <motion.div
                    key={metric.label}
                    variants={fadeUpSmallVariants}
                    className="landing-panel-soft rounded-[1.35rem] p-4"
                  >
                    <span
                      className="landing-chip inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em]"
                      data-tone={metric.tone}
                    >
                      <metric.icon className="mr-1.5 h-3.5 w-3.5" />
                      Signal
                    </span>
                    <p className="mt-5 text-3xl font-semibold text-[#f4efe7]">{metric.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--landing-text-soft)]">{metric.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              <div className="landing-rule mt-8 pt-6">
                <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="landing-panel-soft rounded-[1.35rem] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)]">
                          Guest path
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-[#f4efe7]">
                          Scan. Upload. Appear.
                        </h3>
                      </div>
                      <Command className="h-5 w-5 text-[var(--landing-violet)]" />
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        "QR opens the gallery instantly on mobile",
                        "Uploads route through moderation rules you choose",
                        "Guests see reactions, challenges, and draw prompts in real time",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(102,223,212,0.14)] text-[var(--landing-mint)]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <p className="text-sm leading-6 text-[var(--landing-text-soft)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-panel-soft rounded-[1.35rem] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)]">
                      Operator feed
                    </p>
                    <div className="mt-4 space-y-3">
                      {OPERATOR_FEED.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(177,140,255,0.12)] text-[var(--landing-violet)]">
                              <item.icon className="h-4.5 w-4.5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[#f4efe7]">{item.title}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--landing-text-soft)]">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
