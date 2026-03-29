"use client";

import {
  BadgeCheck,
  Download,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  bulletPointVariants,
  fadeUpVariants,
  indexedSlideLeftVariants,
  landingHeaderViewport,
  landingViewport,
  proofCardVariants,
  staggerContainer,
} from "@/components/landing/motion-variants";

type ProofCard = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  accentClassName: string;
  iconClassName: string;
};

const PROOF_CARDS: ProofCard[] = [
  {
    icon: Shield,
    eyebrow: "Organizer Control",
    title: "Your event, your rules",
    description:
      "Not just a gallery. Galeria gives you the controls you actually need while the event is happening.",
    points: [
      "Manual photo moderation before images go public",
      "Custom event branding, colors, and themes",
      "Guest-friendly uploads without an app install",
    ],
    accentClassName: "from-sky-50/90 to-[#fcf8f2] dark:from-sky-950/20 dark:to-gray-900",
    iconClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    icon: Trophy,
    eyebrow: "Guest Engagement",
    title: "Turn uploads into participation",
    description:
      "Uploads aren&apos;t a dead end. Every photo leads somewhere — a draw entry, a challenge milestone, or a reaction from other guests.",
    points: [
      "Lucky draw entry flows with tiered prizes",
      "Photo challenges with claim and verification steps",
      "Photo reactions to keep the gallery active during the event",
    ],
    accentClassName: "from-violet-50/90 to-[#fcf8f2] dark:from-violet-950/20 dark:to-gray-900",
    iconClassName: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    icon: Download,
    eyebrow: "After the Event",
    title: "Useful data, not just photos",
    description:
      "The event ends, the work doesn&apos;t. Export attendance logs, download galleries, and review event metrics — all in one place.",
    points: [
      "Attendance tracking with QR-based check-ins",
      "Bulk photo export and direct download paths",
      "Organizer visibility into gallery and event activity",
    ],
    accentClassName: "from-emerald-50/90 to-[#fcf8f2] dark:from-emerald-950/20 dark:to-gray-900",
    iconClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

const PROOF_CHIPS = [
  { icon: Sparkles, label: "Custom branding" },
  { icon: QrCode, label: "QR guest flows" },
  { icon: Shield, label: "Manual moderation" },
  { icon: Trophy, label: "Lucky draw + challenges" },
  { icon: Download, label: "Export-ready data" },
  { icon: BadgeCheck, label: "Organizer-friendly controls" },
];

const proofChipVariants = indexedSlideLeftVariants(0.06);

export function ProofSection() {
  return (
    <section id="proof" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f6f1ea] via-[#f1e7f1]/45 to-[#f6f1ea] dark:from-gray-950 dark:via-violet-950/20 dark:to-gray-950" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Product proof
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Built for the way events actually run
          </h2>
          <p className="mt-5 text-lg text-stone-600 dark:text-gray-400">
            Moderation, attendance, lucky draws, exports — these aren&apos;t roadmap
            items. They&apos;re live today.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PROOF_CARDS.map((card, index) => (
            <motion.article
              key={card.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              variants={proofCardVariants}
              className={`rounded-3xl border border-[#e5d8ca]/80 bg-gradient-to-b ${card.accentClassName} p-8 shadow-sm dark:border-gray-800/80`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500 dark:text-gray-400">
                {card.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{card.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-stone-600 dark:text-gray-300">
                {card.description}
              </p>
              <motion.div
                variants={staggerContainer(0.08)}
                className="mt-6 space-y-3"
              >
                {card.points.map((point) => (
                  <motion.div key={point} variants={bulletPointVariants} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-violet-500 dark:text-violet-400" />
                    <span className="text-sm text-stone-700 dark:text-gray-300">{point}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={staggerContainer(0.06)}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {PROOF_CHIPS.map((chip, index) => (
            <motion.div
              key={chip.label}
              custom={index}
              variants={proofChipVariants}
              className="inline-flex items-center gap-2 rounded-full border border-[#e3d6c8] bg-[#fcf8f2]/90 px-4 py-2 text-sm text-stone-700 shadow-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300"
            >
              <chip.icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <span>{chip.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
