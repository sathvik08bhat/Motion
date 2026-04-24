import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Skip type-checking during dev (run `tsc --noEmit` separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable production source maps to reduce memory
  productionBrowserSourceMaps: false,
  // Explicitly opt into Turbopack (default in Next 16)
  turbopack: {},
};

export default nextConfig;
