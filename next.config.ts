import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds from replacing files used by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
