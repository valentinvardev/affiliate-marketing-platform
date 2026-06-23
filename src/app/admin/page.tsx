import Link from "next/link";
import Image from "next/image";
import LogoImg from "/public/logo.png";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { approveUser, rejectUser, createColorPreset, deleteColorPreset, deleteLogoPreset } from "./actions";
import { SignOutButton } from "./sign-out-button";
import { LogoPresetUploader } from "./logo-preset-uploader";
import { Check, X, Trash2, UserCheck, Palette, Image as ImageIcon, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/campaigns");

  const { tab = "users" } = await searchParams;

  const [pendingUsers, activeUsers, colorPresets, logoPresets] = await Promise.all([
    db.user.findMany({ where: { approved: false }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({ where: { approved: true, role: "user" }, orderBy: { createdAt: "desc" } }),
    db.colorPreset.findMany({ orderBy: { createdAt: "asc" } }),
    db.logoPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const TABS = [
    { key: "users",  label: "Usuarios", icon: Users,   badge: pendingUsers.length || undefined },
    { key: "colors", label: "Colores",  icon: Palette, badge: undefined },
    { key: "logos",  label: "Logos",    icon: ImageIcon, badge: undefined },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="flex items-center gap-2">
            <Image src={LogoImg} alt="TapSur" width={24} height={24} className="shrink-0 rounded-md" />
            <span className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>TapSur</span>
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            {session.user.name}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Tab nav */}
        <nav className="mb-8 flex gap-1 rounded-xl p-1" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <Link
              key={key}
              href={`/admin?tab=${key}`}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: tab === key ? "var(--color-surface-overlay)" : "transparent",
                color: tab === key ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge ? (
                <span className="absolute right-2 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: "var(--color-error)", color: "white" }}>
                  {badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-6">
            {/* Pending */}
            <AdminCard title="Pendientes de aprobación" count={pendingUsers.length}>
              {pendingUsers.length === 0 ? (
                <Empty>Sin usuarios pendientes.</Empty>
              ) : (
                <UserTable
                  users={pendingUsers}
                  actions={(u) => (
                    <>
                      <form action={approveUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" title="Aprobar"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--color-success)", border: "1px solid var(--color-border)" }}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <form action={rejectUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" title="Rechazar"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--color-error)", border: "1px solid var(--color-border)" }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </>
                  )}
                />
              )}
            </AdminCard>

            {/* Active */}
            <AdminCard title="Usuarios activos" count={activeUsers.length}>
              {activeUsers.length === 0 ? (
                <Empty>Sin usuarios aprobados todavía.</Empty>
              ) : (
                <UserTable
                  users={activeUsers}
                  actions={(u) => (
                    <form action={rejectUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" title="Eliminar"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                        style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  )}
                />
              )}
            </AdminCard>
          </div>
        )}

        {/* ── COLORS TAB ── */}
        {tab === "colors" && (
          <div className="space-y-6">
            {/* Add form */}
            <AdminCard title="Agregar preset de color">
              <form action={createColorPreset} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Nombre</label>
                  <AdminInput name="name" placeholder="Ej: Azul marino" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Color principal</label>
                  <div className="flex gap-2">
                    <input type="color" name="colorPrimaryHex" defaultValue="#888888"
                      className="h-9 w-10 shrink-0 cursor-pointer rounded-md p-0.5"
                      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }} />
                    <AdminInput name="colorPrimary" placeholder="oklch(0.65 0.22 255)" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Color de fondo</label>
                  <div className="flex gap-2">
                    <input type="color" name="colorBgHex" defaultValue="#111111"
                      className="h-9 w-10 shrink-0 cursor-pointer rounded-md p-0.5"
                      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }} />
                    <AdminInput name="colorBg" placeholder="oklch(0.14 0.05 255)" required />
                  </div>
                </div>
                <div className="col-span-2">
                  <button type="submit"
                    className="rounded-md px-4 py-2 text-sm font-medium"
                    style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                    Agregar preset
                  </button>
                </div>
              </form>
            </AdminCard>

            {/* List */}
            <AdminCard title="Presets actuales" count={colorPresets.length}>
              {colorPresets.length === 0 ? (
                <Empty>Sin presets de color todavía.</Empty>
              ) : (
                <div className="space-y-2">
                  {colorPresets.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                      {/* Color squares */}
                      <div className="flex gap-1 shrink-0">
                        <span className="h-5 w-5 rounded" style={{ background: p.colorPrimary, border: "1px solid rgba(255,255,255,0.08)" }} />
                        <span className="h-5 w-5 rounded" style={{ background: p.colorBg, border: "1px solid rgba(255,255,255,0.08)" }} />
                      </div>
                      <span className="flex-1 text-sm" style={{ color: "var(--color-foreground)" }}>{p.name}</span>
                      <form action={deleteColorPreset}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" title="Eliminar"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--color-muted-foreground)" }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* ── LOGOS TAB ── */}
        {tab === "logos" && (
          <div className="space-y-6">
            <AdminCard title="Subir logo preset">
              <LogoPresetUploader />
            </AdminCard>

            <AdminCard title="Logos guardados" count={logoPresets.length}>
              {logoPresets.length === 0 ? (
                <Empty>Sin logos guardados todavía.</Empty>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {logoPresets.map((lp) => (
                    <div key={lp.id} className="group relative overflow-hidden rounded-xl"
                      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                      <div className="relative aspect-square p-3">
                        <Image src={lp.imageUrl} alt={lp.name} fill className="object-contain p-2" />
                      </div>
                      <p className="truncate px-2 pb-2 text-center text-[11px]"
                        style={{ color: "var(--color-muted-foreground)" }}>{lp.name}</p>
                      <form action={deleteLogoPreset}
                        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <input type="hidden" name="id" value={lp.id} />
                        <button type="submit"
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                          <X className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function AdminCard({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h2>
        {count !== undefined && (
          <span className="rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md px-3 py-2 text-sm outline-none"
      style={{
        background: "var(--color-surface-overlay)",
        border: "1px solid var(--color-border)",
        color: "var(--color-foreground)",
      }}
    />
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-sm py-4" style={{ color: "var(--color-muted-foreground)" }}>{children}</p>
  );
}

function UserTable({
  users,
  actions,
}: {
  users: { id: string; username: string; email: string | null; createdAt: Date }[];
  actions: (u: { id: string; username: string; email: string | null; createdAt: Date }) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground)" }}>
            {u.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{u.username}</p>
            {u.email && <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{u.email}</p>}
          </div>
          <p className="shrink-0 text-[11px]" style={{ color: "var(--color-subtle)" }}>
            {new Date(u.createdAt).toLocaleDateString("es-AR")}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">{actions(u)}</div>
        </div>
      ))}
    </div>
  );
}
