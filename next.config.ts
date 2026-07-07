import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/**': ['./prisma/dev.db'],
  },
};

export default nextConfig;
