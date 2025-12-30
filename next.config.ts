import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bitflow-public.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // Optimize for development hot reload
  ...(process.env.NODE_ENV === 'development' && {
    // Improved cache settings to prevent chunk loading errors
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      // Increased from 25s to 60s to prevent premature chunk disposal
      maxInactiveAge: 60 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      // Increased from 2 to 5 to allow more pages in memory
      pagesBufferLength: 5,
    },
  }),
};

export default nextConfig;
