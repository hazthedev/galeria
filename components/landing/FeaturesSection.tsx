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
    desc: "Guests scan a QR code and start uploading. No app, no sign-up. Photos appear in your branded gallery in real time.",
    bgClassName: "bg-violet-50 dark:bg-violet-900/30",
    iconClassName: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Gift,
    title: "Lucky Draw System",
    desc: "Every upload earns an entry. Run draws with tiered prizes, live animations, and automatic winner tracking.",
    bgClassName: "bg-orange-50 dark:bg-orange-900/30",
    iconClassName: "text-orange-600 dark:text-orange-400",
  },
  {
    icon: Trophy,
    title: "Photo Challenges",
    desc: "Set a photo goal, attach a prize. Guests who hit the target claim rewards via QR — verified on the spot.",
    bgClassName: "bg-purple-50 dark:bg-purple-900/30",
    iconClassName: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Shield,
    title: "Photo Moderation",
    desc: "Review every upload before it goes live. Approve, reject, or let everything through — your call.",
    bgClassName: "bg-blue-50 dark:bg-blue-900/30",
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: QrCode,
    title: "Attendance Tracking",
    desc: "QR check-ins at the door. Real-time headcount, exportable reports, no paper lists.",
    bgClassName: "bg-purple-50 dark:bg-purple-900/30",
    iconClassName: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    desc: "Your colors, your logo, your theme. The gallery looks like your event, not like a third-party tool.",
    bgClassName: "bg-pink-50 dark:bg-pink-900/30",
    iconClassName: "text-pink-600 dark:text-pink-400",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-[#efe7dc]/70 dark:bg-gray-900/50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={featuresHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-5 text-lg text-stone-600 dark:text-gray-400">
            Photo sharing, lucky draws, moderation, attendance — all built in.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -4, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={featureCardVariants}
              className="group relative rounded-3xl border border-[#e5d8ca]/80 bg-[#fcf8f2] p-8 transition-all duration-300 hover:border-[#d9cab8] hover:shadow-xl hover:shadow-[#d8cab8]/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-none"
            >
              <motion.div
                whileHover={{ scale: 1.1, transition: springConfigs.bouncy }}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgClassName}`}
              >
                <feature.icon className={`h-7 w-7 ${feature.iconClassName}`} />
              </motion.div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-gray-400">
                {feature.desc}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
