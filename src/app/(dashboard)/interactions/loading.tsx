import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Interacciones: contenido principal + sidebar de 300px. */
export default function InteractionsLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={120} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Columna principal */}
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skel h={96} r={12} />
              <Skel h={96} r={12} />
            </div>
            <div className="stagger grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skel key={i} h={150} r={12} />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skel key={i} h={48} r={10} />
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
            <Skel w="60%" h={12} r={5} />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skel key={i} h={40} r={8} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
