"use client";

import {
  Camera,
  Gift,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";
import { LandingGlowCard } from "@/components/landing/LandingGlowCard";
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

const heroFeatureVariants = indexedFadeUpVariants(0.12);
const compactFeatureVariants = indexedFadeUpVariants(0.08);

const HERO_FEATURES: Feature[] = [
  {
    icon: Camera,
    title: "Instant Photo Sharing",
    desc: "Guests scan a QR code and start uploading immediately. No app install, no friction.",
    bgClassName: "bg-[rgba(177,140,255,0.14)]",
    iconClassName: "text-[var(--landing-violet)]",
  },
  {
    icon: Shield,
    title: "Live Moderation",
    desc: "Review every photo before it goes public, or let the gallery run open. Your call.",
    bgClassName: "bg-[rgba(102,223,212,0.12)]",
    iconClassName: "text-[var(--landing-mint)]",
  },
  {
    icon: Gift,
    title: "Lucky Draw & Challenges",
    desc: "Turn uploads into draw entries and goal-based challenges that keep the room engaged.",
    bgClassName: "bg-[rgba(232,195,139,0.12)]",
    iconClassName: "text-[var(--landing-gold)]",
  },
];

const COMPACT_FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: QrCode,
    title: "QR Attendance",
    desc: "Door check-in and gallery participation from one system.",
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    desc: "Your colors, logo, and gallery style on every surface.",
  },
  {
    icon: Trophy,
    title: "Post-Event Export",
    desc: "Download galleries, attendance logs, and event metrics.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={featuresHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="landing-kicker mx-auto w-fit rounded-full px-4 py-2 text-[0.8125rem] font-semibold">
            Core capabilities
          </p>
          <h2 className="landing-display mt-6 text-[1.75rem] text-[#f4efe7] sm:text-[2.5rem]">
            Everything you need to run a live event gallery.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--landing-text-soft)] max-md:text-gray-300">
            Every feature ships on the free plan. No gated demos, no enterprise-only walls.
          </p>
        </motion.div>

        {/* Hero features — 3 large cards */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {HERO_FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -4, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={heroFeatureVariants}
              className="h-full"
            >
              <LandingGlowCard
                tone={index === 1 ? "mint" : index === 2 ? "gold" : "violet"}
                className="landing-panel group h-full rounded-[1.8rem] p-8 max-md:p-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05, transition: springConfigs.gentle }}
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgClassName}`}
                >
                  <feature.icon className={`h-7 w-7 ${feature.iconClassName}`} />
                </motion.div>
                <h3 className="mt-6 text-xl font-semibold text-[#f4efe7]">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--landing-text-soft)] max-md:text-gray-300">
                  {feature.desc}
                </p>
              </LandingGlowCard>
            </motion.article>
          ))}
        </div>

        {/* Compact features — 3 smaller items */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {COMPACT_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              variants={compactFeatureVariants}
              className="h-full"
            >
              <LandingGlowCard
                tone={index === 0 ? "mint" : index === 2 ? "gold" : "violet"}
                className="flex h-full items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <feature.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--landing-violet)]" />
                <div>
                  <h3 className="text-base font-semibold text-[#f4efe7]">{feature.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-[var(--landing-text-muted)] max-md:text-gray-300">{feature.desc}</p>
                </div>
              </LandingGlowCard>
            </motion.div>
          ))}
        </div>

        {/* Key stats strip — merged from proof section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
          variants={fadeUpVariants}
          className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { label: "Setup time", value: "< 10 min" },
            { label: "Guest friction", value: "Zero" },
            { label: "Live control", value: "Real-time" },
            { label: "Exports", value: "Ready" },
          ].map((stat) => (
            <LandingGlowCard
              key={stat.label}
              tone={stat.label === "Guest friction" ? "mint" : stat.label === "Exports" ? "gold" : "violet"}
              className="landing-panel-soft rounded-2xl p-5 text-center max-md:border-white/10 max-md:bg-white/5 max-md:p-4"
            >
              <p className="text-xl font-semibold text-[#f4efe7]">{stat.value}</p>
              <p className="mt-1 text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-[var(--landing-text-muted)] max-md:text-gray-300">
                {stat.label}
              </p>
            </LandingGlowCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
