import type { CSSProperties, ReactNode } from "react";

/** Bloque base con shimmer (.skel viene de globals.css). */
export function Skel({
  w, h, r = 8, className, style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`skel${className ? ` ${className}` : ""}`}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

/** Wrapper de página (mismo layout que las páginas reales: columna a pantalla completa). */
export function SkelPage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}

/** Header h-14 con borde inferior — replica el header estándar del dashboard. */
export function SkelHeader({
  icon = false, title = 130, action,
}: {
  icon?: boolean;
  title?: number;
  action?: number;
}) {
  return (
    <div
      className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      {icon && <Skel w={16} h={16} r={5} />}
      <Skel w={title} h={13} r={6} />
      {action != null && <Skel w={action} h={30} r={8} style={{ marginLeft: "auto" }} />}
    </div>
  );
}

/** Tarjeta contenedora vacía con shimmer (borde + fondo raised). */
export function SkelBox({
  h, r = 12, className, style,
}: {
  h?: number | string;
  r?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        height: h,
        borderRadius: r,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-raised)",
        ...style,
      }}
    />
  );
}

/** Grid de tiles/tarjetas uniformes con entrada escalonada. */
export function SkelCards({
  count = 6, h = 120, className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", r = 12,
}: {
  count?: number;
  h?: number;
  className?: string;
  r?: number;
}) {
  return (
    <div className={`stagger ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skel key={i} h={h} r={r} />
      ))}
    </div>
  );
}

/** Lista de filas apiladas con entrada escalonada. */
export function SkelRows({
  count = 6, h = 54, r = 10, gap = "space-y-2.5",
}: {
  count?: number;
  h?: number;
  r?: number;
  gap?: string;
}) {
  return (
    <div className={`stagger ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skel key={i} h={h} r={r} />
      ))}
    </div>
  );
}
