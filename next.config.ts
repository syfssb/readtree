import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      { hostname: 'cdn.weread.qq.com' },
      { hostname: 'weread-1258476243.file.myqcloud.com' },
      { hostname: 'rescdn.qqmail.com' },
    ],
  },
};

export default nextConfig;
