type BrandMarkVariant = "midnight" | "gradient";

type BrandMarkLogo = "current" | "lens" | "frames" | "sharp-g";

type BrandMarkProps = {
  size?: number;
  className?: string;
  gradientId?: string;
  variant?: BrandMarkVariant;
  logoType?: BrandMarkLogo;
};

const BRAND_PALETTES: Record<
  BrandMarkVariant,
  {
    backgroundStops: string[];
    accentStops: string[];
    glowColor: string;
    panelFill: string;
    panelStroke: string;
    coreFill: string;
    sparkleStops: string[];
  }
> = {
  midnight: {
    backgroundStops: ["#171C2F", "#0C1220"],
    accentStops: ["#F6F1EA", "#C4B5FD", "#8B5CF6"],
    glowColor: "rgba(139, 92, 246, 0.28)",
    panelFill: "rgba(255, 255, 255, 0.05)",
    panelStroke: "rgba(255, 255, 255, 0.10)",
    coreFill: "#F6F1EA",
    sparkleStops: ["#DDD6FE", "#A78BFA"],
  },
  gradient: {
    backgroundStops: ["#C4B5FD", "#8B5CF6", "#5B21B6"],
    accentStops: ["#FFFFFF", "#F3E8FF", "#DDD6FE"],
    glowColor: "rgba(255, 255, 255, 0.18)",
    panelFill: "rgba(255, 255, 255, 0.10)",
    panelStroke: "rgba(255, 255, 255, 0.18)",
    coreFill: "#FFFFFF",
    sparkleStops: ["#FFFFFF", "#EDE9FE"],
  },
};

export function BrandMark({
  size = 36,
  className = "",
  gradientId = "gm-bg",
  variant = "midnight",
  logoType = "current",
}: BrandMarkProps) {
  const palette = BRAND_PALETTES[variant];
  const backgroundId = `${gradientId}-background`;
  const accentId = `${gradientId}-accent`;
  const glowId = `${gradientId}-glow`;
  const sparkleId = `${gradientId}-sparkle`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 512 512"
      width={size}
    >
      <defs>
        <linearGradient id={backgroundId} x1="88" x2="424" y1="56" y2="456" gradientUnits="userSpaceOnUse">
          {palette.backgroundStops.map((stopColor, index) => (
            <stop
              key={`${backgroundId}-${stopColor}`}
              offset={palette.backgroundStops.length === 1 ? "0%" : `${(index / (palette.backgroundStops.length - 1)) * 100}%`}
              stopColor={stopColor}
            />
          ))}
        </linearGradient>
        <linearGradient id={accentId} x1="144" x2="372" y1="140" y2="356" gradientUnits="userSpaceOnUse">
          {palette.accentStops.map((stopColor, index) => (
            <stop
              key={`${accentId}-${stopColor}`}
              offset={palette.accentStops.length === 1 ? "0%" : `${(index / (palette.accentStops.length - 1)) * 100}%`}
              stopColor={stopColor}
            />
          ))}
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientTransform="translate(256 256) rotate(90) scale(172)" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette.glowColor} />
          <stop offset="1" stopColor="rgba(255, 255, 255, 0)" />
        </radialGradient>
        <linearGradient id={sparkleId} x1="330" x2="374" y1="130" y2="194" gradientUnits="userSpaceOnUse">
          {palette.sparkleStops.map((stopColor, index) => (
            <stop
              key={`${sparkleId}-${stopColor}`}
              offset={palette.sparkleStops.length === 1 ? "0%" : `${(index / (palette.sparkleStops.length - 1)) * 100}%`}
              stopColor={stopColor}
            />
          ))}
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="112" fill={`url(#${backgroundId})`} />
      <rect x="28" y="28" width="456" height="456" rx="96" fill={palette.panelFill} stroke={palette.panelStroke} strokeWidth="2" />
      <circle cx="256" cy="256" r="162" fill={`url(#${glowId})`} />

      {logoType === "current" && (
        <g>
          <path
            d="M372 194A120 120 0 1 0 372 318"
            stroke={`url(#${accentId})`}
            strokeLinecap="round"
            strokeWidth="52"
          />
          <path d="M258 256H366" stroke={`url(#${accentId})`} strokeLinecap="round" strokeWidth="52" />
          <circle cx="256" cy="256" r={size < 40 ? "40" : "28"} fill={palette.coreFill} />
          {size >= 40 && (
            <path
              d="M348 128L360 154L386 166L360 178L348 204L336 178L310 166L336 154L348 128Z"
              fill={`url(#${sparkleId})`}
            />
          )}
        </g>
      )}

      {logoType === "sharp-g" && (
        <g>
          <path d="M370 216 V156 H156 V356 H356 V256 H236" fill="none" stroke={`url(#${accentId})`} strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter" />
          <rect x="264" y="232" width="48" height="48" fill={palette.coreFill} />
        </g>
      )}

      {logoType === "frames" && (
        <g fill="none">
          <rect x="156" y="206" width="150" height="150" rx="32" stroke={`url(#${accentId})`} strokeWidth="44" />
          <rect x="236" y="116" width="120" height="150" rx="28" stroke={palette.coreFill} opacity="0.9" strokeWidth="36" />
        </g>
      )}

      {logoType === "lens" && (
        <g fill="none">
          <circle cx="256" cy="256" r="120" stroke={`url(#${accentId})`} strokeWidth="40" />
          <path d="M256 136 L216 256" stroke={`url(#${accentId})`} strokeWidth="32" strokeLinecap="round" />
          <path d="M376 256 L256 296" stroke={`url(#${accentId})`} strokeWidth="32" strokeLinecap="round" />
          <path d="M256 376 L296 256" stroke={`url(#${accentId})`} strokeWidth="32" strokeLinecap="round" />
          <path d="M136 256 L256 216" stroke={`url(#${accentId})`} strokeWidth="32" strokeLinecap="round" />
          <circle cx="256" cy="256" r="28" fill={palette.coreFill} />
        </g>
      )}
    </svg>
  );
}
