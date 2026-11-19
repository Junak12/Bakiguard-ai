import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Minimal self-contained server for the Docker image.
  output: "standalone",

  poweredByHeader: false,
};

export default nextConfig;
