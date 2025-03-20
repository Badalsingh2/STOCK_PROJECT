/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        // Existing domains
        {
          protocol: 'https',
          hostname: 'media.assettype.com',
        },
        {
          protocol: 'https',
          hostname: 'media.nbcphiladelphia.com',
        },
        {
          protocol: 'https',
          hostname: 'responsive.fxempire.com',
        },
        // Wildcard pattern for dynamic domains
        {
          protocol: 'https',
          hostname: '**', // Allows ALL domains
        },
      ],
    },
  };
  
  module.exports = nextConfig;