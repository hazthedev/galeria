import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/brand/brand-image';

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
          background: '#F8FAFC',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <BrandMark size={384} borderRadius={110} fontSize={206} />
      </div>
    ),
    size,
  );
}
