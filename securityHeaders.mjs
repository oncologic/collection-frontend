const trimTrailingSlash = (value) => value?.replace(/\/$/, "");

const apiOrigin = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
);

export const frontendContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    apiOrigin,
    "http://localhost:*",
    "ws://localhost:*",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "wss://*.clerk.accounts.dev",
    "wss://*.clerk.com",
    "https://*.amazonaws.com",
    "https://*.blob.core.windows.net",
    "https://*.azureedge.net",
    "https://*.azurefd.net",
    "https://*.cloudfront.net",
    "https://maps.googleapis.com",
  ].join(" "),
  "media-src 'self' blob: https:",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

export const getSecurityHeaders = ({
  includeHsts = process.env.NODE_ENV === "production",
} = {}) => [
  ...(includeHsts
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
  {
    key: "Content-Security-Policy-Report-Only",
    value: frontendContentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
];
