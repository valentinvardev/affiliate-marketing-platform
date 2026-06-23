import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2">
          <div className="shrink-0 overflow-hidden rounded-md" style={{ background: "#fff", width: 32, height: 32 }}>
            <Image src="/logo.png" alt="TapSur" width={32} height={32} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            TapSur
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
