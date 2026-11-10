import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/vendors",
  "/packages",
  "/users",
  "/reports",
  "/klien",
];

// Rute publik yang tidak butuh sesi: /undangan/[token] (undangan digital),
// /checkin/[eventToken] (check-in mandiri tamu), /login, dan /api publik.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("wo_session");
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/vendors/:path*",
    "/packages/:path*",
    "/users/:path*",
    "/reports/:path*",
    "/klien/:path*",
  ],
};
