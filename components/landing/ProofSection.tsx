"use client";

import {
  BadgeCheck,
  Building2,
  Download,
  LineChart,
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
    eyebrow: "Operator control",
    title: "Run the gallery like a live system",
    description:
      "Not just a gallery. Galeria gives you the controls you actually need while the event is happening.",
    points: [
      "Manual photo moderation before images go public",
      "Custom event branding, colors, and themes",
      "Guest-friendly uploads without an app install",
    ],
    accentClassName: "border-[rgba(102,223,212,0.18)]",
    iconClassName: "bg-[rgba(102,223,212,0.12)] text-[var(--landing-mint)]",
  },
  {
    icon: Trophy,
    eyebrow: "Engagement design",
    title: "Make participation feel visible",
    description:
      "Uploads are not a dead end. Every photo leads somewhere: a draw entry, a challenge milestone, or a reaction from other guests.",
    points: [
      "Lucky draw entry flows with tiered prizes",
      "Photo challenges with claim and verification steps",
      "Photo reactions to keep the gallery active during the event",
    ],
    accentClassName: "border-[rgba(177,140,255,0.18)]",
    iconClassName: "bg-[rgba(177,140,255,0.14)] text-[var(--landing-violet)]",
  },
  {
    icon: Download,
    eyebrow: "After the event",
    title: "Leave with useful assets, not just a folder",
    description:
      "The event ends, the work does not. Export attendance logs, download galleries, and review event metrics in one place.",
    points: [
      "Attendance tracking with QR-based check-ins",
      "Bulk photo export and direct download paths",
      "Organizer visibility into gallery and event activity",
    ],
    accentClassName: "border-[rgba(232,195,139,0.18)]",
    iconClassName: "bg-[rgba(232,195,139,0.12)] text-[var(--landing-gold)]",
  },
];

const PROOF_CHIPS = [
  { icon: Sparkles, label: "Custom branding" },
  { icon: Shield, label: "Manual moderation" },
  { icon: Trophy, label: "Lucky draw + challenges" },
  { icon: Download, label: "Export-ready data" },
  { icon: Building2, label: "Cross-event portfolio" },
  { icon: LineChart, label: "Operational visibility" },
];

const proofChipVariants = indexedSlideLeftVariants(0.06);

export function ProofSection() {
  return (
    <section id="proof" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={landingHeaderViewport}
            variants={fadeUpVariants}
            className="landing-panel rounded-[2rem] p-7 sm:p-8"
          >
            <p className="landing-kicker w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold">
              Product proof
            </p>
            <h2 className="landing-display mt-6 text-4xl text-[#f4efe7] sm:text-5xl">
              Built for events that need more than a shared folder.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[var(--landing-text-soft)]">
              Moderation, attendance, lucky draws, branded galleries, and exports are not
              roadmap promises here. They are part of the operating model from the first event.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="landing-panel-soft rounded-[1.35rem] p-5 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)]">
                  Why teams switch
                </p>
                <p className="mt-3 text-3xl font-semibold text-[#f4efe7]">
                  One system from guest capture to wrap-up.
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--landing-text-soft)]">
                  Instead of stitching together upload links, check-in sheets, giveaway tools,
                  and post-event downloads, Galeria keeps the flow in one branded surface.
                </p>
              </div>
              {[
                { label: "Setup", value: "< 10 min" },
                { label: "Control", value: "Live" },
                { label: "Guest friction", value: "Low" },
                { label: "Exports", value: "Ready" },
              ].map((item) => (
                <div key={item.label} className="landing-panel-soft rounded-[1.35rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--landing-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-[#f4efe7]">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-4">
            {PROOF_CARDS.map((card, index) => (
              <motion.article
                key={card.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={landingViewport}
                variants={proofCardVariants}
                className={`landing-panel rounded-[1.8rem] border ${card.accentClassName} p-7`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <span className="landing-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                    {card.eyebrow}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-[#f4efe7]">{card.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--landing-text-soft)]">
                  {card.description}
                </p>
                <motion.div variants={staggerContainer(0.08)} className="mt-6 grid gap-3 sm:grid-cols-3">
                  {card.points.map((point) => (
                    <motion.div
                      key={point}
                      variants={bulletPointVariants}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <BadgeCheck className="h-4.5 w-4.5 text-[var(--landing-violet)]" />
                      <span className="mt-3 block text-sm leading-6 text-[var(--landing-text-soft)]">
                        {point}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={staggerContainer(0.06)}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          {PROOF_CHIPS.map((chip, index) => (
            <motion.div
              key={chip.label}
              custom={index}
              variants={proofChipVariants}
              className="landing-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              <chip.icon className="h-4 w-4 text-[var(--landing-violet)]" />
              <span>{chip.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
