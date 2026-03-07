import type { CSSProperties, ReactElement } from 'react';

const BRAND_NAVY = '#0F172A';
const BRAND_MUTED = '#475569';
const BRAND_MINT = '#10B981';
const BRAND_CYAN = '#06B6D4';
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
        background: `linear-gradient(135deg, ${BRAND_MINT} 0%, ${BRAND_CYAN} 100%)`,
        borderRadius,
        boxShadow: '0 24px 48px rgba(6, 182, 212, 0.18)',
        color: '#FFFFFF',
        display: 'flex',
        fontSize,
        fontWeight: 800,
        height: size,
        justifyContent: 'center',
        letterSpacing: '-0.08em',
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
    background: BRAND_SOFT,
    color: BRAND_NAVY,
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(6, 182, 212, 0.16) 100%)',
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
              color: BRAND_NAVY,
              display: 'flex',
              fontSize: height >= 512 ? 120 : 58,
              fontWeight: 800,
              letterSpacing: '-0.06em',
              lineHeight: 1,
            }}
          >
            Galeria
          </div>
          <div
            style={{
              color: BRAND_MUTED,
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
