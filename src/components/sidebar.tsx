"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutGrid, BookOpen, ShieldCheck, LogOut, CircleUserRound, BarChart2, Package, Trophy, Wallet, Heart, LayoutDashboard, CreditCard, Coins, X, Users, Globe, Shuffle, Sparkles, Network, Brain, GraduationCap, Newspaper, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversionTestButton } from "@/components/conversion-toast";
import { useT } from "@/components/i18n-provider";
import { t } from "@/lib/i18n-client";
import { Tooltip } from "@/components/ui/tooltip";
import { AvatarUploader } from "@/components/avatar-uploader";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  /** Deshabilitado para usuarios normales (el admin sí entra). */
  adminOnlyAccess?: boolean;
  disabledReason?: string;
};
type NavGroup = { title?: string; items: NavItem[]; adminOnly?: boolean; estrategistaOnly?: boolean };

const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/overview", icon: LayoutDashboard, label: "Inicio" }] },
  {
    title: "Campañas",
    items: [
      { href: "/campaigns", icon: LayoutGrid, label: "Campañas" },
      { href: "/campaigns/new", icon: BookOpen, label: "Nueva campaña" },
      { href: "/offers", icon: Package, label: "Ofertas" },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/cards", icon: CreditCard, label: "Tarjetas" },
      { href: "/wallet", icon: Wallet, label: "Billetera" },
      { href: "/interactions", icon: Heart, label: "Interacciones" },
    ],
  },
  {
    title: "Contenido",
    items: [
      { href: "/sparks", icon: Sparkles, label: "Sparks" },
      { href: "/feed", icon: Newspaper, label: "Feed" },
      { href: "/proxies", icon: Network, label: "Proxies" },
      {
        href: "/redirecciones",
        icon: Shuffle,
        label: "Redirecciones",
        adminOnlyAccess: true,
        disabledReason: "Inhabilitado por mantenimiento",
      },
    ],
  },
  {
    title: "Análisis",
    items: [
      { href: "/mapa", icon: Globe, label: "Mapa" },
      { href: "/stats", icon: BarChart2, label: "Estadísticas" },
      { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    ],
  },
  { items: [{ href: "/tutoriales", icon: GraduationCap, label: "Tutoriales" }] },
  { estrategistaOnly: true, items: [{ href: "/equipo", icon: Users, label: "Mi equipo" }] },
  {
    title: "Admin",
    adminOnly: true,
    items: [
      { href: "/angulos", icon: Brain, label: "Ángulos" },
      { href: "/finanzas", icon: Coins, label: "Finanzas" },
      { href: "/admin", icon: ShieldCheck, label: "Admin" },
    ],
  },
];

export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const username = session?.user?.name ?? "…";

  const [open, setOpen] = useState(false);

  // Abrir/cerrar desde el botón hamburguesa del header
  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("sidebar:toggle", toggle);
    return () => window.removeEventListener("sidebar:toggle", toggle);
  }, []);

  // Cerrar al navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isEstrategista = session?.user?.role === "estrategista";
  const groups = NAV_GROUPS.filter(
    (g) => (!g.adminOnly || isAdmin) && (!g.estrategistaOnly || isEstrategista),
  );

  return (
    <>
      {/* Backdrop (solo móvil, cuando está abierto) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/55 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-60 flex-col transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-background)" }}
      >
      {/* Logo */}
      <div
        className="flex h-14 shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="TapSur" width={52} height={52} className="shrink-0 rounded-md" />
        <span className="flex-1 text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-brand)", color: "var(--color-foreground)" }}>
          TapSur
        </span>
        <ConversionTestButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-md p-1 transition-opacity hover:opacity-70 md:hidden"
          style={{ color: "var(--color-muted-foreground)" }}
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => (
          <div key={g.title ?? `g${gi}`} className={gi > 0 ? "mt-5" : undefined}>
            {g.title && (
              <p
                className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-subtle)" }}
              >
                {t(g.title)}
              </p>
            )}
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} isAdmin={isAdmin} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <AvatarUploader name={username} size={28} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{username}</p>
            {isAdmin && (
              <p className="text-[10px]" style={{ color: "var(--color-subtle)" }}>{t("Admin")}</p>
            )}
          </div>
          <button
            type="button"
            title={t("Cerrar sesión")}
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-subtle)" }}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

/**
 * Item del sidebar. Si está marcado como `adminOnlyAccess` y el usuario no es
 * admin, se renderiza como texto inerte con un tooltip que explica por qué —
 * en vez de un link que lleva a una pantalla que no puede usar.
 */
function NavLink({
  item, pathname, isAdmin,
}: {
  item: NavItem;
  pathname: string;
  isAdmin: boolean;
}) {
  const { href, icon: Icon, label } = item;
  const blocked = !!item.adminOnlyAccess && !isAdmin;
  const active =
    !blocked &&
    href !== "#" &&
    pathname.startsWith(href) &&
    !(href === "/campaigns" && pathname === "/campaigns/new");

  const base = "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors";

  if (blocked) {
    return (
      <Tooltip content={t(item.disabledReason ?? "Inhabilitado")} side="right">
        <span
          aria-disabled
          className={cn(base, "w-full cursor-not-allowed select-none")}
          style={{ color: "var(--color-subtle)", opacity: 0.55 }}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t(label)}</span>
          <Lock className="h-3 w-3 shrink-0" />
        </span>
      </Tooltip>
    );
  }

  return (
    <Link
      href={href}
      className={cn(base, active ? "font-medium" : "font-normal")}
      style={{
        background: active ? "var(--color-surface-raised)" : "transparent",
        color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)";
          (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
        }
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {t(label)}
    </Link>
  );
}
