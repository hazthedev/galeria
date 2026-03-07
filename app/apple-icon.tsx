import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/brand/brand-image';

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
          background: '#F8FAFC',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <BrandMark size={136} borderRadius={40} fontSize={72} />
      </div>
    ),
    size,
  );
}
