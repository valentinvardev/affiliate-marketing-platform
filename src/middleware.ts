import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Resuelve el slug de landing según el Host de la request.
 * - APP_HOST (y www.) → null  ⇒ es el panel (auth normal).
 * - LANDING_DOMAINS (JSON dominio→slug) → slug del dominio custom.
 * - <slug>.LANDING_BASE → ese subdominio es el slug.
 * Sin env configurado o en localhost → null (todo es el panel).
 */
function landingSlug(host: string | null): string | null {
  if (!host) return null;
  const h = (host.split(":")[0] ?? "").toLowerCase();
  if (!h || h === "localhost" || h === "127.0.0.1") return null;

  const APP_HOST = process.env.APP_HOST?.toLowerCase();
  if (APP_HOST && (h === APP_HOST || h === `www.${APP_HOST}`)) return null;

  let domains: Record<string, string> = {};
  try { domains = JSON.parse(process.env.LANDING_DOMAINS ?? "{}") as Record<string, string>; } catch { /* ignore */ }
  if (domains[h]) return domains[h];

  const LANDING_BASE = process.env.LANDING_BASE?.toLowerCase();
  if (LANDING_BASE && h.endsWith(`.${LANDING_BASE}`) && h !== LANDING_BASE) {
    const sub = h.slice(0, h.length - LANDING_BASE.length - 1);
    if (sub && sub !== "app" && sub !== "www") return sub;
  }
  return null;
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const slug = landingSlug(req.headers.get("host"));

    // ── Host de landing: servir la landing, sin auth ──
    if (slug) {
      if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/landing/${slug}`, req.url));
    }

    // ── Host del panel: chequeo de admin ──
    const { token } = req.nextauth;
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/campaigns", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Los hosts de landing no requieren sesión
        if (landingSlug(req.headers.get("host"))) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!api/auth|api/config|api/register|api/admin-setup|api/upload|api/postback|landing|_next/static|_next/image|favicon\\.ico|login|register|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
