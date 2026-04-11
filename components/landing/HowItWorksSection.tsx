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
  support: string;
};

const STEPS: Step[] = [
  {
    step: "01",
    title: "Create Event",
    desc: "Set up your event with custom branding, upload rules, and optional systems like lucky draw or photo challenges.",
    icon: Sparkles,
    colorClassName: "from-[#b18cff] to-[#8f6aff]",
    support: "Decide the rules before guests arrive.",
  },
  {
    step: "02",
    title: "Share QR Code",
    desc: "Display the unique QR code at your venue. Guests scan it to open the gallery and start uploading instantly.",
    icon: QrCode,
    colorClassName: "from-[#66dfd4] to-[#5bb6ff]",
    support: "The room only needs one visible code to begin.",
  },
  {
    step: "03",
    title: "Run the Room",
    desc: "Watch uploads stream in live, moderate content when needed, and run your engagement loops from one surface.",
    icon: Play,
    colorClassName: "from-[#e8c38b] to-[#ff8ca0]",
    support: "You manage the event and the wrap-up in the same place.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-28 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={landingHeaderViewport}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="landing-kicker mx-auto w-fit rounded-full px-4 py-2 text-[0.68rem] font-semibold">
            Guided setup
          </p>
          <h2 className="landing-display mt-6 text-4xl text-[#f4efe7] sm:text-6xl">
            Launch a room-ready gallery without
            <span className="block text-[var(--landing-text-soft)]">
              building a process around it.
            </span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--landing-text-soft)]">
            The flow stays simple on purpose: set the event up, share the QR path, and let the
            system take over the repetitive work.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
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
                <div className="absolute left-[calc(50%+60px)] top-[4.5rem] hidden h-px w-[calc(100%-120px)] lg:block">
                  <motion.div
                    custom={index}
                    variants={connectorLineVariants}
                    style={{ transformOrigin: "left center" }}
                    className="h-full w-full border-t border-dashed border-white/12"
                  />
                </div>
              )}

              <div className="landing-panel relative flex h-full flex-col rounded-[1.8rem] p-7 text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--landing-text-muted)]">
                  Step {item.step}
                </span>
                <div
                  className={`relative mt-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.colorClassName} text-white shadow-lg`}
                >
                  <item.icon className="h-7 w-7" />
                  <motion.div
                    variants={stepBadgeVariants}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[#08111d] text-xs font-bold text-[#f4efe7]"
                  >
                    {item.step}
                  </motion.div>
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-[#f4efe7]">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--landing-text-soft)]">{item.desc}</p>
                <div className="landing-rule mt-6 pt-5 text-sm text-[var(--landing-text-muted)]">
                  {item.support}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
