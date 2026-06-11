import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // The repo root is the monorepo root (two levels up from apps/web).
  // Pinning it silences the "multiple lockfiles" workspace-root warning.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
