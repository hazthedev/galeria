import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Galeria',
    short_name: 'Galeria',
    description: 'Capture Moments, Together',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
