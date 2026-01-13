import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true,
            },
          },
        ],
        as: "*.js",
      },
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/experience/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/experience/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: "/billing/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://polar.sh",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
