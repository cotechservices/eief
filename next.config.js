// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard/admin/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/dashboard/directeur/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/dashboard/comptable/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/dashboard/enseignant/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/dashboard/parent/:path*',
        destination: '/dashboard/:path*',
      },
      {
        source: '/dashboard/eleve/:path*',
        destination: '/dashboard/:path*',
      },
    ];
  },
};

module.exports = nextConfig;