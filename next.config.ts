import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for development hot reload
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce cache time for faster updates
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
  }),
};

export default nextConfig;
