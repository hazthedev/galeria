import type { NextConfig } from "next";
import webpack from 'webpack';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
const isProduction = process.env.NODE_ENV === 'production';
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns,
    loader: 'custom',
    loaderFile: './lib/images/loader.ts',
  },
  // Exclude server-only packages from client bundle
  output: 'standalone',
  // Externalize server-only packages from client bundle (use webpack, not turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Completely replace server-only packages with empty module on client
      // This is more aggressive than externals - webpack won't even try to resolve them
      config.resolve.alias = {
        ...config.resolve.alias,
        // Block server-only files
        '@/jobs/scan-content': false,
        '@/lib/moderation/init': false,
        // Block server-only packages (completely ignore, don't trace)
        'pg': false,
        'pg-connection-string': false,
        'pg-native': false,
        'pg-query-stream': false,
        'pgpass': false,
        'bullmq': false,
        'ioredis': false,
        'bcrypt': false,
        '@aws-sdk/client-rekognition': false,
        '@aws-sdk/client-s3': false,
      };

      // Tell webpack to ignore ALL Node.js-only modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js built-ins
        fs: false,
        path: false,
        net: false,
        tls: false,
        dns: false,
        stream: false,
        'string_decoder': false,
        child_process: false,
        crypto: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        events: false,
        util: false,
        // Server-only packages (fallback protection)
        'pg-native': false,
        'pg-query-stream': false,
        'pgpass': false,
        'pg-connection-string': false,
        'node-gyp-build': false,
        'split2': false,
        'bullmq': false,
        'ioredis': false,
        'bcrypt': false,
      };
    } else {
      // For the server build (including instrumentation), mark Node.js-native
      // packages as externals so webpack never tries to bundle them.
      // This prevents errors like "Can't resolve 'path'" from bullmq/ioredis
      // during the instrumentation compilation pass.
      const nodeExternals = [
        'bullmq',
        'ioredis',
        'bcrypt',
        'pg',
        'pg-native',
        'pg-connection-string',
        'pgpass',
        'pg-query-stream',
        'split2',
        '@aws-sdk/client-rekognition',
        '@aws-sdk/client-s3',
      ];

      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request && nodeExternals.some((pkg) => request === pkg || request.startsWith(pkg + '/'))) {
            // Treat as a CommonJS external — require() at runtime, don't bundle
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
  // Externalize server-only packages for server components
  serverExternalPackages: [
    'pg',
    'pg-native',
    'pg-connection-string',
    'pgpass',
    'pg-query-stream',
    'split2',
    'ioredis',
    'bcrypt',
    'bullmq',
    '@aws-sdk/client-rekognition',
    '@aws-sdk/client-s3',
  ],
};

export default nextConfig;
