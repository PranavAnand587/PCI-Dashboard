import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Cache static GeoJSON file
        source: '/india_v2.json',
        headers: [
          {
            key: 'Cache-Control',
            // value: 'public, max-age=31536000, immutable',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate', // Disabled cache for update
          },
        ],
      },
    ]
  },
};

export default nextConfig;
