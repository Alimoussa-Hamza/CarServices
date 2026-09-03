import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@carservice/api-client', '@carservice/ui-tokens'],
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
