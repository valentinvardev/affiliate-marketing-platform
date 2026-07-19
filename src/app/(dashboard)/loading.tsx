/** Skeleton instantáneo al navegar entre tabs (Next.js muestra esto mientras carga la page). */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-14 shrink-0 items-center px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="skel" style={{ width: 150, height: 15 }} />
      </div>
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 108, borderRadius: 12, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <div className="skel" style={{ height: 260, borderRadius: 12 }} />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: 54, borderRadius: 10, animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
