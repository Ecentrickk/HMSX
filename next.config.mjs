/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    outputFileTracingIncludes: {
      '/*': [
        './node_modules/.prisma/**/*',
        './node_modules/@prisma/client/**/*',
      ],
    },
  },
};

export default nextConfig;
