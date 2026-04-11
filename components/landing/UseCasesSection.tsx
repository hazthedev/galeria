"use client";

import { Building2, Heart, PartyPopper, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";
import { LandingGlowCard } from "@/components/landing/LandingGlowCard";
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
  iconBg: string;
  iconColor: string;
  borderClassName: string;
};

const useCaseVariants = indexedFadeUpVariants(0.1);

const USE_CASES: UseCase[] = [
  {
    icon: PartyPopper,
    title: "Birthday Parties",
    desc: "Kids chase the lucky draw. Parents leave with a complete gallery.",
    iconBg: "bg-[rgba(255,124,136,0.14)]",
    iconColor: "text-[var(--landing-danger)]",
    borderClassName: "border-[rgba(255,124,136,0.18)]",
  },
  {
    icon: Heart,
    title: "Weddings",
    desc: "Every guest becomes a photographer. The couple gets one branded gallery.",
    iconBg: "bg-[rgba(177,140,255,0.14)]",
    iconColor: "text-[var(--landing-violet)]",
    borderClassName: "border-[rgba(177,140,255,0.18)]",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    desc: "Branded galleries, QR check-ins, and clean post-event assets for recap decks.",
    iconBg: "bg-[rgba(102,223,212,0.12)]",
    iconColor: "text-[var(--landing-mint)]",
    borderClassName: "border-[rgba(102,223,212,0.18)]",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="landing-kicker mx-auto w-fit rounded-full px-4 py-2 text-[0.8125rem] font-semibold">
            Where it fits
          </p>
          <h2 className="landing-display mt-6 text-[1.75rem] text-[#f4efe7] sm:text-[2.5rem]">
            From private parties to public programs.
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {USE_CASES.map((item, index) => (
            <motion.article
              key={item.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -4, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={useCaseVariants}
              className="h-full"
            >
              <LandingGlowCard
                tone={index === 0 ? "rose" : index === 2 ? "mint" : "violet"}
                className={`landing-panel h-full rounded-[1.8rem] border ${item.borderClassName} p-7`}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg}`}
                >
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#f4efe7]">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--landing-text-soft)]">{item.desc}</p>
              </LandingGlowCard>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
