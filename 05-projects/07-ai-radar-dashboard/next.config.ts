import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./data/daily-bundle.json"],
  },
};

export default nextConfig;
