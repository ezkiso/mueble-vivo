/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// En desarrollo, Next.js necesita 'unsafe-eval' y 'unsafe-inline' para el
// Hot Module Replacement (recarga en vivo). En producción esto NO se usa:
// la CSP queda estricta, sin unsafe-inline ni unsafe-eval.
const csp = [
  "default-src 'self'",
  "img-src 'self' res.cloudinary.com data: https://*.tile.openstreetmap.org",
  "style-src 'self'" + (isDev ? " 'unsafe-inline'" : ""),
  "script-src 'self'" + (isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""),
  "font-src 'self' data:",
  "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://nominatim.openstreetmap.org" + (isDev ? " ws://localhost:* http://localhost:*" : ""),
  "form-action 'self' https://webpay3g.transbank.cl https://webpay3gint.transbank.cl",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
