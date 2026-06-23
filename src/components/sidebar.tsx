"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutGrid, BookOpen, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_BASE = [
  { href: "/campaigns",     icon: LayoutGrid, label: "Campañas" },
  { href: "/campaigns/new", icon: BookOpen,   label: "Nueva campaña" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const username = session?.user?.name ?? "…";

  const nav = isAdmin
    ? [...NAV_BASE, { href: "/admin", icon: ShieldCheck, label: "Admin" }]
    : NAV_BASE;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col"
      style={{ borderRight: "1px solid var(--color-border)" }}
    >
      {/* Logo */}
      <div
        className="flex h-14 shrink-0 items-center gap-2 px-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="shrink-0 overflow-hidden rounded-md" style={{ background: "#fff", width: 28, height: 28 }}>
          <Image src="/logo.png" alt="TapSur" width={28} height={28} />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
          TapSur
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-subtle)" }}
        >
          General
        </p>
        <ul className="space-y-0.5">
          {nav.map(({ href, icon: Icon, label }) => {
            const active =
              href !== "#" &&
              pathname.startsWith(href) &&
              !(href === "/campaigns" && pathname === "/campaigns/new");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active ? "font-medium" : "font-normal",
                  )}
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
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}
          >
            {username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium" style={{ color: "var(--color-foreground)" }}>{username}</p>
            {isAdmin && (
              <p className="text-[10px]" style={{ color: "var(--color-subtle)" }}>Admin</p>
            )}
          </div>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-subtle)" }}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
