import type { CSSProperties, ReactElement } from 'react';

const BRAND_DARK = '#131A2E';
const BRAND_MUTED = '#475569';
const BRAND_PURPLE = '#8B5CF6';
const BRAND_PURPLE_DEEP = '#7C3AED';
const BRAND_PURPLE_LIGHT = '#A78BFA';
const BRAND_SOFT = '#F8FAFC';

type BrandMarkProps = {
  size: number;
  borderRadius: number;
  fontSize: number;
};

export function BrandMark({ size, borderRadius, fontSize }: BrandMarkProps): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        background: `linear-gradient(180deg, ${BRAND_DARK} 0%, #0C1220 100%)`,
        borderRadius,
        boxShadow: '0 24px 48px rgba(124, 58, 237, 0.18)',
        color: BRAND_PURPLE,
        display: 'flex',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      G
    </div>
  );
}

export function BrandMarkGradient({ size, borderRadius, fontSize }: BrandMarkProps): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        background: `linear-gradient(135deg, ${BRAND_PURPLE_LIGHT} 0%, ${BRAND_PURPLE_DEEP} 50%, #5B21B6 100%)`,
        borderRadius,
        boxShadow: '0 24px 48px rgba(124, 58, 237, 0.25)',
        color: '#FFFFFF',
        display: 'flex',
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      G
    </div>
  );
}

export function createBrandPreview(width: number, height: number): ReactElement {
  const containerStyle: CSSProperties = {
    alignItems: 'center',
    background: BRAND_DARK,
    color: '#FFFFFF',
    display: 'flex',
    height,
    justifyContent: 'center',
    position: 'relative',
    width,
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)',
          borderRadius: 48,
          height: height - 96,
          position: 'absolute',
          width: width - 96,
        }}
      />
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 40,
          position: 'relative',
        }}
      >
        <BrandMark size={height >= 512 ? 168 : 96} borderRadius={height >= 512 ? 48 : 28} fontSize={height >= 512 ? 88 : 48} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              display: 'flex',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: height >= 512 ? 120 : 58,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Galeria
          </div>
          <div
            style={{
              color: BRAND_PURPLE_LIGHT,
              display: 'flex',
              fontSize: height >= 512 ? 40 : 22,
              fontWeight: 500,
            }}
          >
            Capture moments, together
          </div>
        </div>
      </div>
    </div>
  );
}
