type BrandMarkProps = {
  size?: number;
  className?: string;
  gradientId?: string;
};

export function BrandMark({
  size = 36,
  className = "",
  gradientId = "gm-bg",
}: BrandMarkProps) {
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
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#131A2E" />
          <stop offset="100%" stopColor="#0C1220" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${gradientId})`} />
      <text
        x="256"
        y="310"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="280"
        fontWeight="700"
        fill="#8B5CF6"
      >
        G
      </text>
    </svg>
  );
}
