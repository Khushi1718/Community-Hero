import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that use Clerk authentication (citizens)
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/community(.*)",
  "/volunteer-org/register(.*)",  // Registration is public
  "/api/auth/login(.*)",    // Our custom staff login endpoint
  "/api/users(.*)",         // Used by auth-context on every load
  "/api/issues(.*)",        // Public issue data
  "/api/analyze(.*)",
  "/api/notifications(.*)",
  "/api/dashboard(.*)",
  "/api/community(.*)",
  "/api/copilot(.*)",
  "/api/volunteer-org(.*)", // Org API — uses its own auth
  "/api/volunteer-drives(.*)", // Drives API
  "/api/certificates(.*)",
  "/api/generate-certificate(.*)",
  "/api/analytics(.*)",
  "/api/adopted-areas(.*)",
  "/api/leaderboard(.*)",
  "/api/webhooks(.*)",      // External webhooks
  "/api/config(.*)",        // Public config endpoints
  "/api/audit(.*)",         // Audit logs
]);

// Staff routes — use our custom DB auth, NOT Clerk
// Clerk must NOT protect these routes
const isStaffRoute = createRouteMatcher([
  "/admin(.*)",
  "/employee(.*)",
  "/super-admin(.*)",
  "/volunteer-org/dashboard(.*)", // Org dashboard uses devBypass, not Clerk
  "/api/admin(.*)",               // Admin API routes bypass Clerk
]);

export default clerkMiddleware(async (auth, request) => {
  // Staff routes bypass Clerk entirely — they use our custom session (localStorage devBypass)
  if (isStaffRoute(request)) {
    return; // Let the page handle its own auth
  }

  // Public routes don't need Clerk auth
  if (isPublicRoute(request)) {
    return;
  }

  // All other routes (e.g. /report, /my-reports, /profile) require Clerk sign-in
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
