import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type HostKind =
  | { kind: "panel" }
  | { kind: "slug"; slug: string }
  | { kind: "domain" };

/**
 * Clasifica el Host de la request:
 * - "panel"  → el panel con login (localhost, APP_HOST/www, apex LANDING_BASE).
 * - "slug"   → <slug>.LANDING_BASE → landing de ese subdominio (slug = subdominio).
 * - "domain" → cualquier otro dominio (ej. empfohlen.lat) → landing resuelta por DB
 *              en la ruta /landing leyendo el Host (sin tocar el .env).
 *
 * Si no hay APP_HOST ni LANDING_BASE configurados (local/single-domain), todo es panel.
 */
function resolveHost(host: string | null): HostKind {
  if (!host) return { kind: "panel" };
  const h = (host.split(":")[0] ?? "").toLowerCase();
  if (!h || h === "localhost" || h === "127.0.0.1") return { kind: "panel" };

  const APP_HOST = process.env.APP_HOST?.toLowerCase();
  if (APP_HOST && (h === APP_HOST || h === `www.${APP_HOST}`)) return { kind: "panel" };

  const LANDING_BASE = process.env.LANDING_BASE?.toLowerCase();
  if (LANDING_BASE) {
    if (h === LANDING_BASE || h === `www.${LANDING_BASE}`) return { kind: "panel" };
    if (h.endsWith(`.${LANDING_BASE}`)) {
      const sub = h.slice(0, h.length - LANDING_BASE.length - 1);
      if (sub && sub !== "app" && sub !== "www") return { kind: "slug", slug: sub };
      return { kind: "panel" };
    }
  }

  // Sin multi-dominio configurado → todo es panel (no rompemos local/single-domain).
  if (!APP_HOST && !LANDING_BASE) return { kind: "panel" };

  // Dominio custom: la landing se resuelve por DB en /landing.
  return { kind: "domain" };
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const r = resolveHost(req.headers.get("host"));

    // ── Host de landing (subdominio o dominio custom): servir sin auth ──
    if (r.kind === "slug" || r.kind === "domain") {
      if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
        return NextResponse.next();
      }
      // Subdominio: el slug ES el subdominio → /landing/<sub>.
      // Dominio custom (path-based): <domain>/<slug> → /landing/<slug>;
      //   el root <domain>/ → /landing (campaña "home" del dominio, si hay).
      const target =
        r.kind === "slug"
          ? `/landing/${r.slug}`
          : pathname === "/"
            ? "/landing"
            : `/landing${pathname}`;
      return NextResponse.rewrite(new URL(target, req.url));
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
        const kind = resolveHost(req.headers.get("host")).kind;
        if (kind === "slug" || kind === "domain") return true;
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
