import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "leadflow_super_admin_secret_key_2026_separate_auth"
);

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Ignore static assets & Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Super Admin API protection (/api/admin/**)
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get("admin_session")?.value;
    if (!adminToken) {
      return new NextResponse(null, { status: 404 });
    }

    try {
      const { payload } = await jwtVerify(adminToken, ADMIN_JWT_SECRET);
      if (!payload.isSuperAdmin || !payload.adminId) {
        return new NextResponse(null, { status: 404 });
      }
      return NextResponse.next();
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  // 2. Super Admin UI protection (/admin/**)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get("admin_session")?.value;
    if (!adminToken) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    try {
      const { payload } = await jwtVerify(adminToken, ADMIN_JWT_SECRET);
      if (!payload.isSuperAdmin || !payload.adminId) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
