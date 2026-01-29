import type { NextConfig } from "next";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
if (R2_PUBLIC_URL) {
  try {
    const url = new URL(R2_PUBLIC_URL);
    remotePatterns.push(url);
  } catch {
    // Ignore invalid URL
  }
}

remotePatterns.push({
  protocol: 'https',
  hostname: 'pub-6cb0a45a6e9e4069bb6e10a94ae8c269.r2.dev',
  port: '',
  pathname: '/**',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    loader: 'custom',
    loaderFile: './lib/images/loader.ts',
  },
};

export default nextConfig;
