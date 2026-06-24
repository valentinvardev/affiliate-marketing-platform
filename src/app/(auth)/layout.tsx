export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TapSur" width={52} height={52} className="shrink-0 rounded-md" />
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            TapSur
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
