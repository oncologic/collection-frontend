import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-in/(.*)",
  "/sign-up",
  "/sign-up/(.*)",
  "/shared",
  "/shared/(.*)",
  "/pricing",
  "/pricing/(.*)",
]);
const isAdminRoute = createRouteMatcher(["/data", "/admin(.*)"]);

const isNextInternalRoute = (pathname) =>
  pathname.startsWith("/_next/") || pathname.includes("/favicon.ico");

const getArrayClaim = (claims, key) => {
  const value = claims?.metadata?.[key] || claims?.publicMetadata?.[key];
  return Array.isArray(value) ? value : [];
};

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (isNextInternalRoute(pathname) || isPublicRoute(req)) {
    return null;
  }

  const authObject = await auth.protect();
  const { sessionClaims } = authObject;

  const userRoles = getArrayClaim(sessionClaims, "roles");
  const userTenant =
    sessionClaims?.publicMetadata?.tenant || sessionClaims?.metadata?.tenant;
  const isPersonalTenant = userTenant === "personal";

  if (isPersonalTenant) {
    const personalTenantAllowedRoutes = [
      "/dashboard",
      "/profile",
      "/tutorials",
      "/personal",
      "/sign-out",
    ];

    const isAllowedRoute = personalTenantAllowedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (!isAllowedRoute && pathname.includes("community")) {
      return Response.redirect(new URL("/personal/dashboard", req.nextUrl));
    }
  }

  if (isAdminRoute(req) && !userRoles.includes("admin")) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }

  return null;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
