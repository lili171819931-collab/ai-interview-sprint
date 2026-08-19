import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/demo.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
