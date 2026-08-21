import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const neonMiddleware = auth.middleware({
  loginUrl: "/auth/sign-in",
});

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Let API requests and static assets pass directly without middleware interception
  if (url.pathname.startsWith("/api") || url.pathname.includes(".")) {
    return NextResponse.next();
  }

  // Run Neon Auth middleware to process OAuth token exchanges and session refreshes
  const response = await neonMiddleware(request);

  // Public paths where unauthenticated guests should not be forced to sign in
  const isPublicPath =
    url.pathname === "/" ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/auth");

  if (response.status === 307 || response.status === 302) {
    const location = response.headers.get("location");
    // If middleware wants to redirect to login on a public storefront page, allow guest access
    if (isPublicPath && location && location.includes("/auth/sign-in")) {
      return NextResponse.next();
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static files (.glb, .gltf, .png, .jpg, .jpeg, .webp, .svg, .ico, .txt, .xml, .css, .js, .woff, .woff2, .ttf)
     */
    "/((?!api|_next/static|_next/image|.*\\.(?:glb|gltf|png|jpg|jpeg|webp|svg|ico|txt|xml|css|js|woff|woff2|ttf)$).*)",
  ],
};
