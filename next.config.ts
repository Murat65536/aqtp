import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external packages for Transformers.js
  serverExternalPackages: ['@huggingface/transformers'],
  // Enable turbopack with empty config
  turbopack: {},
};

export default nextConfig;
