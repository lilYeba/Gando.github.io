import type { NextConfig } from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/Gando.github.io' : '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isGithubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: isGithubPages,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'images.openfoodfacts.net' },
      { protocol: 'https', hostname: 'static.openfoodfacts.org' },
      { protocol: 'https', hostname: 'www.lidl.sk' },
      { protocol: 'https', hostname: 'lidl.sk' },
      { protocol: 'https', hostname: 'www.lidl.com' },
      { protocol: 'https', hostname: 'lidl.com' },
      { protocol: 'https', hostname: 'www-new.lidl.com' },
      { protocol: 'https', hostname: 'media.lidl-flyer.com' },
      { protocol: 'https', hostname: 'media.lidl-cdn.net' },
      { protocol: 'https', hostname: 'images.cdn.europe-west1.gcp.commercetools.com' },
      { protocol: 'https', hostname: 'digitalcontent.api.tesco.com' },
      { protocol: 'https', hostname: 'www.billa.sk' },
      { protocol: 'https', hostname: 'www.tesco.sk' }
    ]
  },
  serverExternalPackages: ['node:sqlite']
};

export default nextConfig;

