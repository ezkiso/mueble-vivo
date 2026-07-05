/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Next.js App Router genera scripts inline para su propia hidratación (fuera de
// nuestro control), por eso script-src necesita 'unsafe-inline'. Se compensa
// restringiendo todo lo demás: sin dominios externos de script, sin eval en
// producción, y CSRF + Zod + JWT httpOnly cubriendo la superficie de ataque real.
const csp = [
  "default-src 'self'",
  "img-src 'self' res.cloudinary.com data: https://*.tile.openstreetmap.org",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ''),
  "font-src 'self' data:",
  "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://nominatim.openstreetmap.org" +
    (isDev ? ' ws://localhost:* http://localhost:*' : ''),
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