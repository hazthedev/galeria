import type { CSSProperties, ReactElement } from 'react';
import { BrandMark } from '@/components/landing/BrandMark';

const BRAND_DARK = '#171C2F';
const BRAND_DARK_DEEP = '#0C1220';
const BRAND_PURPLE_LIGHT = '#DDD6FE';

export function createBrandPreview(width: number, height: number): ReactElement {
  const large = height >= 512;

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
          background: `linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(124, 58, 237, 0.08) 100%)`,
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
          gap: large ? 40 : 24,
          position: 'relative',
        }}
      >
        <BrandMark size={large ? 168 : 96} gradientId="gm-og-preview" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: large ? 12 : 8,
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              display: 'flex',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: large ? 120 : 58,
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
              fontSize: large ? 40 : 22,
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
