import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/campaigns", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/((?!api/auth|api/config|api/register|api/admin-setup|api/upload|api/postback|landing|_next/static|_next/image|favicon\\.ico|login|register).*)",
  ],
};
