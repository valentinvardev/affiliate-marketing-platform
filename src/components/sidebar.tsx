"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/campaigns", icon: LayoutGrid, label: "Campañas" },
  { href: "/campaigns/new", icon: BookOpen, label: "Nueva" },
  { href: "#", icon: Settings, label: "Config", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col"
      style={{ borderRight: "1px solid var(--color-border)" }}
    >
      {/* Logo */}
      <div
        className="flex h-14 shrink-0 items-center gap-2.5 px-5"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-black"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          A
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>
          Aff CMS
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
          {NAV.map(({ href, icon: Icon, label, disabled }) => {
            const active = href !== "#" && pathname.startsWith(href) && !(href === "/campaigns" && pathname === "/campaigns/new");
            return (
              <li key={href}>
                <Link
                  href={disabled ? "#" : href}
                  aria-disabled={disabled}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "font-medium"
                      : "font-normal",
                    disabled && "pointer-events-none",
                  )}
                  style={{
                    background: active ? "var(--color-surface-raised)" : "transparent",
                    color: active
                      ? "var(--color-foreground)"
                      : disabled
                        ? "var(--color-subtle)"
                        : "var(--color-muted-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active && !disabled)
                      (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)";
                    if (!active && !disabled)
                      (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    if (!active && !disabled)
                      (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {disabled && (
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: "var(--color-surface-overlay)",
                        color: "var(--color-subtle)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      Pronto
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
          v0.1.0 · T3 + Supabase
        </p>
      </div>
    </aside>
  );
}
