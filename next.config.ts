import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    // Only run ESLint on the 'pages' and 'utils' directories during production builds
    dirs: ['pages', 'utils'],
    // Allow production builds to successfully complete even if the project has ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if the project has TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
