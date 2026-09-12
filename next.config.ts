import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Prisma 7 driver adapter must not be bundled by the server compiler.
  // pdfkit reads its built-in AFM font metrics from disk relative to its own
  // module path, so it must stay external too (bundling breaks that lookup).
  serverExternalPackages: ["@prisma/client", "mariadb", "@prisma/adapter-mariadb", "pdfkit"],
  images: {
    // Next's default JPEG/WebP quality is 75, which visibly softens product
    // photos; 85–90 keeps them crisp for a modest byte cost. Callers pass
    // `quality={90}` for hero/gallery imagery — values must be listed here.
    qualities: [30, 75, 85, 90],
    formats: ["image/avif", "image/webp"],
    // Widths that match our real layouts (cards ≈ 320 px → 640/960 on 2–3×
    // screens, gallery ≈ 600 px → 1200/1800) so the browser never picks a
    // too-small candidate and upscales it.
    deviceSizes: [480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [40, 64, 96, 128, 160, 240, 320, 400],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
