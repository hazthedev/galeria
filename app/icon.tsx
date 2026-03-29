import { ImageResponse } from 'next/og';
import { BrandMark } from '@/components/landing/BrandMark';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
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
        <BrandMark size={512} gradientId="gm-app-icon" />
      </div>
    ),
    size,
  );
}
