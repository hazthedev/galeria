import type { Variants } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";

export const landingViewport = { once: true, amount: 0.2 } as const;
export const landingHeaderViewport = { once: true, amount: 0.2 } as const;
export const featuresHeaderViewport = { once: true, amount: 0.3 } as const;

export const navRevealVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.smooth,
  },
};

export const fadeUpSmallVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.smooth,
  },
};

export const heroBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.smooth,
  },
};

export const heroWordVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    scale: [1, 1, 1.02, 1],
    transition: {
      y: springConfigs.smooth,
      opacity: { duration: 0.35, ease: "easeOut" },
      scale: {
        duration: 0.7,
        times: [0, 0.55, 0.8, 1],
        ease: "easeInOut",
        delay: 0.55,
      },
    },
  },
};

export const statListVariants = (staggerChildren: number = 0.1): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren: 0.2,
    },
  },
});

export const staggerContainer = (
  staggerChildren: number,
  delayChildren: number = 0,
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const indexedFadeUpVariants = (delayStep: number): Variants => ({
  hidden: { opacity: 0, y: 30 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      delay: index * delayStep,
    },
  }),
});

export const indexedSlideLeftVariants = (delayStep: number): Variants => ({
  hidden: { opacity: 0, x: -10 },
  visible: (index: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      ...springConfigs.smooth,
      delay: index * delayStep,
    },
  }),
});

export const indexedPopVariants = (
  delayStep: number,
  startDelay: number = 0,
): Variants => ({
  hidden: { opacity: 0, scale: 0 },
  visible: (index: number = 0) => ({
    opacity: 1,
    scale: [0, 1.1, 1],
    transition: {
      duration: 0.45,
      times: [0, 0.7, 1],
      ease: "easeOut",
      delay: startDelay + index * delayStep,
    },
  }),
});

export const proofCardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      delay: index * 0.12,
      when: "beforeChildren",
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  }),
};

export const bulletPointVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfigs.gentle,
  },
};

export const stepVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      delay: index * 0.2,
    },
  }),
};

export const connectorLineVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: (index: number = 0) => ({
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut",
      delay: index * 0.2 + 0.14,
    },
  }),
};

export const stepBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: [0, 1.2, 1],
    transition: {
      ...springConfigs.elastic,
      times: [0, 0.7, 1],
    },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfigs.smooth,
  },
};
