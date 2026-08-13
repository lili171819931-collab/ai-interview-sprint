import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin tracing to this app (repo has a parent package-lock.json)
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/data/**"],
      };
    }
    return config;
  },
  async redirects() {
    return [
      { source: "/tools", destination: "/leaderboard", permanent: false },
      { source: "/tools/:id", destination: "/leaderboard", permanent: false },
    ];
  },
};

export default nextConfig;
