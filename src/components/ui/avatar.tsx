"use client";

/**
 * Foto de perfil con fallback a la inicial.
 *
 * El color del círculo se deriva del nombre, así cada persona mantiene el
 * mismo color en toda la app aunque no tenga foto — se distinguen de un
 * vistazo sin que sea aleatorio en cada render.
 */
export function Avatar({
  name, url, size = 32, className,
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={className}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          flexShrink: 0, border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  let h = 0;
  for (const c of name || "?") h = (h * 31 + c.charCodeAt(0)) % 360;

  return (
    <span
      className={className}
      aria-label={name}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.42), fontWeight: 700, color: "#fff",
        background: `linear-gradient(140deg, hsl(${h} 55% 52%), hsl(${(h + 40) % 360} 52% 38%))`,
        border: "1px solid var(--color-border)",
      }}
    >
      {initial}
    </span>
  );
}
