import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin tracing to this app (repo has a parent package-lock.json)
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
};

export default nextConfig;
