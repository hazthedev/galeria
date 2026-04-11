"use client";

import { Building2, Heart, PartyPopper, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";
import {
  fadeUpVariants,
  indexedFadeUpVariants,
  landingHeaderViewport,
  landingViewport,
} from "@/components/landing/motion-variants";

type UseCase = {
  icon: LucideIcon;
  title: string;
  desc: string;
  gradientClassName: string;
  borderClassName: string;
  support: string;
};

const useCaseVariants = indexedFadeUpVariants(0.1);

const USE_CASES: UseCase[] = [
  {
    icon: PartyPopper,
    title: "Birthday Parties",
    desc: "Kids chase the lucky draw. Parents leave with a complete gallery instead of scattered phone uploads.",
    gradientClassName: "from-[#ff8ca0] to-[#f16a86]",
    borderClassName: "border-[rgba(255,124,136,0.18)]",
    support: "Great when you want guests and families to contribute without needing instructions.",
  },
  {
    icon: Heart,
    title: "Weddings & Receptions",
    desc: "Every guest becomes a photographer. The couple gets a branded gallery they never had to chase down.",
    gradientClassName: "from-[#b18cff] to-[#8f6aff]",
    borderClassName: "border-[rgba(177,140,255,0.18)]",
    support: "Ideal for memory-rich events where the gallery should feel like part of the experience.",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    desc: "Branded galleries, QR check-ins, and clean post-event assets that are ready for recap decks and internal reports.",
    gradientClassName: "from-[#66dfd4] to-[#5bb6ff]",
    borderClassName: "border-[rgba(102,223,212,0.18)]",
    support: "Strong fit for teams that need branding, attendance, and a clean operational recap.",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="landing-kicker mx-auto w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold">
            Where it fits
          </p>
          <h2 className="landing-display mt-6 text-4xl text-[#f4efe7] sm:text-6xl">
            The same operating model scales from private parties to public programs.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--landing-text-soft)]">
            Different rooms need different energy, but the pattern holds: easy guest capture,
            visible participation, and a clean asset trail after the doors close.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {USE_CASES.map((item, index) => (
            <motion.article
              key={item.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -6, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={useCaseVariants}
              className={`landing-panel relative overflow-hidden rounded-[2rem] border ${item.borderClassName} p-8`}
            >
              <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_65%)]" />
              <motion.div
                whileHover={{ scale: 1.06, transition: springConfigs.gentle }}
                className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradientClassName} text-white shadow-lg`}
              >
                <item.icon className="h-9 w-9" />
              </motion.div>
              <div className="mt-8 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-semibold text-[#f4efe7]">{item.title}</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)]">
                  Best fit
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-[var(--landing-text-soft)]">{item.desc}</p>
              <div className="landing-rule mt-8 pt-5">
                <p className="text-sm leading-6 text-[var(--landing-text-soft)]">{item.support}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
