import { getSecurityHeaders } from "./securityHeaders.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(),
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "med-resource-connect-logos.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "mrc-file-uploads.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "*.azureedge.net",
      },
      {
        protocol: "https",
        hostname: "*.azurefd.net",
      },
      {
        protocol: "https",
        hostname: "d3q5mz27otbl2j.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
