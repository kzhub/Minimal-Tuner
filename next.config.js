/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  crossOrigin: 'anonymous',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
  // ビルド時の警告を抑制
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,
  // キャッシュの最適化
  generateEtags: true,
};

module.exports = nextConfig;
