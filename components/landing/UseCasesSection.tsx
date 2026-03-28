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
  bgClassName: string;
};

const useCaseVariants = indexedFadeUpVariants(0.1);

const USE_CASES: UseCase[] = [
  {
    icon: PartyPopper,
    title: "Birthday Parties",
    desc: "Kids chase the lucky draw. Parents get every photo in one place.",
    gradientClassName: "from-pink-500 to-rose-500",
    bgClassName: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
  },
  {
    icon: Heart,
    title: "Weddings & Receptions",
    desc: "Every guest becomes a photographer. The couple gets a gallery they didn&apos;t have to organise.",
    gradientClassName: "from-violet-500 to-purple-500",
    bgClassName: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    desc: "Branded galleries, QR check-ins, and exportable attendance data — ready for the recap deck.",
    gradientClassName: "from-indigo-500 to-violet-500",
    bgClassName: "from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-gray-50 dark:bg-gray-900/50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Perfect for any event
          </h2>
          <p className="mt-5 text-lg text-gray-500 dark:text-gray-400">
            From birthday parties to company summits
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          {USE_CASES.map((item, index) => (
            <motion.article
              key={item.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              whileHover={{ y: -6, transition: springConfigs.gentle }}
              viewport={landingViewport}
              variants={useCaseVariants}
              className={`relative overflow-hidden rounded-3xl border border-gray-200/50 bg-gradient-to-b ${item.bgClassName} p-10 text-center transition-all duration-300 hover:shadow-xl dark:border-gray-800/50`}
            >
              <motion.div
                whileHover={{
                  scale: 1.12,
                  rotate: 3,
                  transition: springConfigs.bouncy,
                }}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradientClassName} text-white shadow-lg`}
              >
                <item.icon className="h-9 w-9" />
              </motion.div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                {item.desc}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
