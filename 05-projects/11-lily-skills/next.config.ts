import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    // node:sqlite is a built-in; nothing to externalize
  },
};

export default nextConfig;
