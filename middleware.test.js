const mockClerkMiddleware = jest.fn((handler) => handler);

const routeMatches = (pattern, pathname) => {
  if (pattern === pathname) {
    return true;
  }

  if (pattern.endsWith("(.*)")) {
    const base = pattern.slice(0, -4).replace(/\/$/, "");
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  return false;
};

const mockCreateRouteMatcher = jest.fn(
  (patterns) => (req) =>
    patterns.some((pattern) => routeMatches(pattern, req.nextUrl.pathname)),
);

jest.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: mockClerkMiddleware,
  createRouteMatcher: mockCreateRouteMatcher,
}));

const middleware = require("./middleware").default;

class TestHeaders {
  constructor(headers = {}) {
    this.headers = new Map(
      Object.entries(headers).map(([key, value]) => [
        key.toLowerCase(),
        String(value),
      ]),
    );
  }

  get(key) {
    return this.headers.get(key.toLowerCase()) || null;
  }
}

class TestResponse {
  constructor(_body, init = {}) {
    this.status = init.status || 200;
    this.headers = new TestHeaders(init.headers);
  }

  static redirect(url, status = 302) {
    return new TestResponse(null, {
      status,
      headers: {
        location: url.toString(),
      },
    });
  }
}

const buildRequest = (pathname) => ({
  nextUrl: new URL(`https://registry.test${pathname}`),
});

const buildAuth = (authObject = {}) => {
  const auth = jest.fn();
  auth.protect = jest.fn(async () => ({
    sessionClaims: {},
    ...authObject,
  }));
  return auth;
};

describe("Clerk middleware route protection", () => {
  beforeAll(() => {
    global.Response = TestResponse;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not require authentication for public routes", async () => {
    const auth = buildAuth();

    await expect(
      middleware(auth, buildRequest("/shared/resource-1")),
    ).resolves.toBeNull();

    expect(auth.protect).not.toHaveBeenCalled();
  });

  it("uses Clerk auth.protect for protected routes", async () => {
    const auth = buildAuth();

    await expect(
      middleware(auth, buildRequest("/dashboard")),
    ).resolves.toBeNull();

    expect(auth.protect).toHaveBeenCalledTimes(1);
  });

  it("redirects non-admin users away from admin routes", async () => {
    const auth = buildAuth({
      sessionClaims: {
        metadata: {
          roles: ["patient"],
        },
      },
    });

    const response = await middleware(auth, buildRequest("/admin/users"));

    expect(auth.protect).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://registry.test/dashboard",
    );
  });

  it("allows admin users through admin routes", async () => {
    const auth = buildAuth({
      sessionClaims: {
        metadata: {
          roles: ["admin"],
        },
      },
    });

    await expect(
      middleware(auth, buildRequest("/admin/users")),
    ).resolves.toBeNull();
  });

  it("redirects personal tenant users away from community routes", async () => {
    const auth = buildAuth({
      sessionClaims: {
        publicMetadata: {
          tenant: "personal",
        },
      },
    });

    const response = await middleware(
      auth,
      buildRequest("/community/resources"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://registry.test/personal/dashboard",
    );
  });

  it("fails closed when Clerk protection throws unexpectedly", async () => {
    const auth = buildAuth();
    auth.protect.mockRejectedValueOnce(new Error("auth unavailable"));

    await expect(middleware(auth, buildRequest("/dashboard"))).rejects.toThrow(
      "auth unavailable",
    );
  });
});
