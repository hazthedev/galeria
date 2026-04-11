"use client";

import {
  Camera,
  CheckCircle2,
  Gift,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";
import {
  fadeUpVariants,
  featuresHeaderViewport,
  indexedFadeUpVariants,
  landingViewport,
} from "@/components/landing/motion-variants";

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  bgClassName: string;
  iconClassName: string;
};

const featureCardVariants = indexedFadeUpVariants(0.08);

const FEATURES: Feature[] = [
  {
    icon: Camera,
    title: "Instant Photo Sharing",
    desc: "Guests scan once and start contributing immediately. No app install, no lost moments, no hand-holding at the venue.",
    bgClassName: "bg-[rgba(177,140,255,0.14)]",
    iconClassName: "text-[var(--landing-violet)]",
  },
  {
    icon: Gift,
    title: "Lucky Draw System",
    desc: "Every upload can become an entry. Build prize momentum into the gallery instead of treating participation as an afterthought.",
    bgClassName: "bg-[rgba(232,195,139,0.12)]",
    iconClassName: "text-[var(--landing-gold)]",
  },
  {
    icon: Trophy,
    title: "Photo Challenges",
    desc: "Turn uploads into momentum with goal-based prompts and verification flows that make rewards feel earned on the floor.",
    bgClassName: "bg-[rgba(177,140,255,0.12)]",
    iconClassName: "text-[var(--landing-violet)]",
  },
  {
    icon: Shield,
    title: "Photo Moderation",
    desc: "Decide whether the gallery runs open, curated, or fully reviewed. You stay in control without slowing the event down.",
    bgClassName: "bg-[rgba(102,223,212,0.12)]",
    iconClassName: "text-[var(--landing-mint)]",
  },
  {
    icon: QrCode,
    title: "Attendance Tracking",
    desc: "Run door check-in and gallery participation from the same system, with a live count that actually helps operations.",
    bgClassName: "bg-[rgba(102,223,212,0.12)]",
    iconClassName: "text-[var(--landing-mint)]",
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    desc: "Use your own colors, logo, and gallery style so the experience feels designed for the event, not rented from a tool.",
    bgClassName: "bg-[rgba(177,140,255,0.14)]",
    iconClassName: "text-[var(--landing-violet)]",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={featuresHeaderViewport}
            variants={fadeUpVariants}
          >
            <p className="landing-kicker w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold">
              Core capabilities
            </p>
            <h2 className="landing-display mt-6 text-4xl text-[#f4efe7] sm:text-6xl">
              A guest experience that feels easy.
              <span className="block text-[var(--landing-text-soft)]">An operator surface that does not blink.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={featuresHeaderViewport}
            variants={fadeUpVariants}
            className="landing-panel rounded-[2rem] p-6 sm:p-8"
          >
            <p className="max-w-2xl text-lg leading-8 text-[var(--landing-text-soft)]">
              Galeria is built around one job: make event participation feel effortless while
              giving organizers enough control to manage what is happening right now, not after
              the room has moved on.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Live galleries", "Moderation rules", "QR attendance", "Reward loops"].map((item) => (
                <span key={item} className="landing-chip rounded-full px-4 py-2 text-sm" data-tone="signal">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -4, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={featureCardVariants}
              className="landing-panel group rounded-[1.8rem] p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, transition: springConfigs.gentle }}
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgClassName}`}
                >
                  <feature.icon className={`h-7 w-7 ${feature.iconClassName}`} />
                </motion.div>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#f4efe7]">{feature.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[var(--landing-text-soft)]">
                {feature.desc}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-[var(--landing-text-soft)]">
                <CheckCircle2 className="h-4.5 w-4.5 text-[var(--landing-mint)]" />
                Included in the self-serve product, not held back for enterprise demos.
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
