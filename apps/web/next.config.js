const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@ehms/types', '@ehms/validation'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = withNextIntl(nextConfig);
