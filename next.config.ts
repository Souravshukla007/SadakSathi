import type { NextConfig } from "next";

// Sent on every response. CSP is limited to what cannot break Google Translate or
// Next's inline scripts: no framing, no plugins, no <base> hijack, forms only to us/Google.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://accounts.google.com",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle for Docker/Raspberry Pi (`node .next/standalone/server.js`).
  output: "standalone",
  // Every /api request passes through src/proxy.ts, and Next keeps only the first 10 MB of a body that
  // does. The upload page allows 100 MB videos, so without this a big video arrives cut off.
  experimental: { proxyClientMaxBodySize: "110mb" },
  // Old placeholder routes now point at the real pages.
  async redirects() {
    return [
      { source: "/login", destination: "/auth", permanent: true },
      { source: "/signup", destination: "/auth", permanent: true },
      { source: "/my-complaints", destination: "/dashboard", permanent: true },
      { source: "/unified-detector", destination: "/upload", permanent: true },
      { source: "/admin", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
