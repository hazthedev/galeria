import type { Variants } from "motion/react";
import { springConfigs } from "@/lib/shared/animations";

export const landingViewport = { once: true, amount: 0.2 } as const;
export const landingHeaderViewport = { once: true, amount: 0.2 } as const;
export const featuresHeaderViewport = { once: true, amount: 0.3 } as const;

export const navRevealVariants: Variants = {
  hidden: { opacity: 0, y: -18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeUpSmallVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const heroBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const heroWordVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    scale: [1, 1.015, 1],
    transition: {
      y: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
      opacity: { duration: 0.45, ease: "easeOut" },
      scale: {
        duration: 0.9,
        times: [0, 0.7, 1],
        ease: "easeInOut",
        delay: 0.45,
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
  hidden: { opacity: 0, y: 26 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
      delay: index * delayStep,
    },
  }),
});

export const indexedSlideLeftVariants = (delayStep: number): Variants => ({
  hidden: { opacity: 0, x: -16 },
  visible: (index: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
      delay: index * delayStep,
    },
  }),
});

export const indexedPopVariants = (
  delayStep: number,
  startDelay: number = 0,
): Variants => ({
  hidden: { opacity: 0, scale: 0.88 },
  visible: (index: number = 0) => ({
    opacity: 1,
    scale: [0.88, 1.02, 1],
    transition: {
      duration: 0.5,
      times: [0, 0.75, 1],
      ease: "easeOut",
      delay: startDelay + index * delayStep,
    },
  }),
});

export const proofCardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.12,
      when: "beforeChildren",
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  }),
};

export const bulletPointVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const stepVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
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
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.2 + 0.2,
    },
  }),
};

export const stepBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: [0.9, 1.04, 1],
    transition: {
      duration: 0.45,
      times: [0, 0.75, 1],
      ease: "easeOut",
    },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
