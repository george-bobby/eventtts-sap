/** @type {import('next').NextConfig} */
const nextConfig = {
  // The 'output: "export"' line has been removed.
  // This is the only change needed to fix the errors.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/f/*',
      },
    ],
  },
};

module.exports = nextConfig;