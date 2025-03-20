import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enables static site export
  images: {
    unoptimized: true, // Required for Netlify if using Next.js Image component
  },
};

export default nextConfig;
