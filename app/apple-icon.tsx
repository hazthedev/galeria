import { ImageResponse } from 'next/og';
import { BrandMarkGradient } from '@/lib/brand/brand-image';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'transparent',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <BrandMarkGradient size={180} borderRadius={40} fontSize={96} />
      </div>
    ),
    size,
  );
}
