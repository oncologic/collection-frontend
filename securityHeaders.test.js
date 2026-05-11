describe("security headers config", () => {
  it("defines a report-only CSP with required frontend allowlists", async () => {
    const { frontendContentSecurityPolicy, getSecurityHeaders } = await import(
      "./securityHeaders.mjs"
    );

    expect(frontendContentSecurityPolicy).toContain("default-src 'self'");
    expect(frontendContentSecurityPolicy).toContain("object-src 'none'");
    expect(frontendContentSecurityPolicy).toContain(
      "https://*.clerk.accounts.dev",
    );
    expect(frontendContentSecurityPolicy).toContain("https://player.vimeo.com");
    expect(frontendContentSecurityPolicy).toContain("https://www.youtube.com");

    const headers = getSecurityHeaders({ includeHsts: true });
    expect(headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Content-Security-Policy-Report-Only",
          value: frontendContentSecurityPolicy,
        }),
        expect.objectContaining({
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        }),
        expect.objectContaining({
          key: "X-Content-Type-Options",
          value: "nosniff",
        }),
      ]),
    );
  });

  it("registers the headers globally in Next config", async () => {
    const { default: nextConfig } = await import("./next.config.mjs");

    const headerRules = await nextConfig.headers();

    expect(headerRules).toHaveLength(1);
    expect(headerRules[0].source).toBe("/:path*");
    expect(headerRules[0].headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Content-Security-Policy-Report-Only",
        }),
        expect.objectContaining({
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        }),
        expect.objectContaining({
          key: "X-Frame-Options",
          value: "DENY",
        }),
      ]),
    );
  });
});
