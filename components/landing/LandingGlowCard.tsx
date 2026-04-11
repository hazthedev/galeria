"use client";

import type { CSSProperties, HTMLAttributes, PointerEvent } from "react";
import { cn } from "@/lib/shared/utils/utils";

type LandingGlowTone = "violet" | "mint" | "gold" | "rose";

type LandingGlowCardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: LandingGlowTone;
};

const TONE_STYLES: Record<
  LandingGlowTone,
  {
    color: string;
    highlight: string;
  }
> = {
  violet: {
    color: "rgba(177, 140, 255, 0.28)",
    highlight: "rgba(177, 140, 255, 0.22)",
  },
  mint: {
    color: "rgba(102, 223, 212, 0.24)",
    highlight: "rgba(102, 223, 212, 0.2)",
  },
  gold: {
    color: "rgba(232, 195, 139, 0.24)",
    highlight: "rgba(232, 195, 139, 0.2)",
  },
  rose: {
    color: "rgba(255, 124, 136, 0.26)",
    highlight: "rgba(255, 124, 136, 0.2)",
  },
};

export function LandingGlowCard({
  tone = "violet",
  className,
  style,
  onPointerMove,
  onPointerLeave,
  onPointerEnter,
  children,
  ...props
}: LandingGlowCardProps) {
  const palette = TONE_STYLES[tone];

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty("--landing-glow-x", `${x}px`);
    event.currentTarget.style.setProperty("--landing-glow-y", `${y}px`);
    event.currentTarget.style.setProperty("--landing-glow-opacity", "1");
    onPointerMove?.(event);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--landing-glow-opacity", "1");
    onPointerEnter?.(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--landing-glow-opacity", "0");
    onPointerLeave?.(event);
  };

  return (
    <div
      className={cn("landing-glow-card", className)}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={
        {
          "--landing-glow-color": palette.color,
          "--landing-glow-highlight": palette.highlight,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <div aria-hidden="true" className="landing-glow-card__orb" />
      {children}
    </div>
  );
}
