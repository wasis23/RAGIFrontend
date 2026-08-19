import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
    }
    return config;
  },
};

export default nextConfig;
