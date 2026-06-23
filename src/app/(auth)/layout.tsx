export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded text-xs font-black"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
          >
            A
          </div>
          <span
            className="text-base font-semibold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            Aff CMS
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
