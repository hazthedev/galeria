"use client";

import { Play, QrCode, Sparkles, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  connectorLineVariants,
  fadeUpVariants,
  landingHeaderViewport,
  landingViewport,
  stepBadgeVariants,
  stepVariants,
} from "@/components/landing/motion-variants";

type Step = {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  colorClassName: string;
};

const STEPS: Step[] = [
  {
    step: "01",
    title: "Create Event",
    desc: "Set up your event with custom branding, upload rules, and optional features like lucky draw or photo challenges.",
    icon: Sparkles,
    colorClassName: "from-violet-500 to-purple-500",
  },
  {
    step: "02",
    title: "Share QR Code",
    desc: "Display the unique QR code at your venue. Guests scan it to access the gallery and start uploading photos instantly.",
    icon: QrCode,
    colorClassName: "from-purple-500 to-fuchsia-500",
  },
  {
    step: "03",
    title: "Engage & Enjoy",
    desc: "Watch photos stream in live. Moderate content, run lucky draws, and download all photos after the event.",
    icon: Play,
    colorClassName: "from-fuchsia-500 to-pink-500",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Get started in 3 simple steps
          </h2>
          <p className="mt-5 text-lg text-stone-600 dark:text-gray-400">
            Your gallery goes live in under two minutes
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {STEPS.map((item, index) => (
            <motion.div
              key={item.step}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={landingViewport}
              variants={stepVariants}
              className="relative"
            >
              {index < STEPS.length - 1 && (
                <div className="absolute left-[calc(50%+60px)] top-16 hidden h-px w-[calc(100%-120px)] lg:block">
                  <motion.div
                    custom={index}
                    variants={connectorLineVariants}
                    style={{ transformOrigin: "left center" }}
                    className="h-full w-full border-t-2 border-dashed border-[#e3d6c8] dark:border-gray-800"
                  />
                </div>
              )}
              <div className="relative flex flex-col items-center text-center">
                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.colorClassName} text-white shadow-lg`}
                >
                  <item.icon className="h-9 w-9" />
                  <motion.div
                    variants={stepBadgeVariants}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#fcf8f2] text-xs font-bold text-gray-900 shadow-md ring-2 ring-[#ece0d4] dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                  >
                    {item.step}
                  </motion.div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-stone-600 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
