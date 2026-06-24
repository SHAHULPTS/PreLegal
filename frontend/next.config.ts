import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained build (.next/standalone) for a lean production
  // container image — see the Dockerfile.
  output: "standalone",
};

export default nextConfig;
