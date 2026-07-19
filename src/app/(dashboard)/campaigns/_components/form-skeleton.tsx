import { Skel } from "@/components/ui/skel";

/** Cuerpo del "studio" del formulario de campaña: columna de campos + preview lateral. */
export function CampaignFormSkeleton() {
  return (
    <main className="flex min-h-0 flex-1">
      {/* Columna de formulario */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Tabs / pasos */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 py-3 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {[92, 84, 80, 70, 96].map((w, i) => (
            <Skel key={i} w={w} h={30} r={999} />
          ))}
        </div>
        {/* Campos */}
        <div className="flex-1 px-4 pt-6 md:px-8">
          <div className="mx-auto max-w-xl space-y-5">
            <div>
              <Skel w={120} h={16} r={6} />
              <Skel w={230} h={11} r={5} style={{ marginTop: 8 }} />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skel w={90} h={11} r={5} />
                <Skel h={40} r={8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview lateral (desktop) */}
      <aside className="hidden shrink-0 justify-center p-6 lg:flex" style={{ width: 400, borderLeft: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <Skel r={28} style={{ width: 300, height: 600 }} />
      </aside>
    </main>
  );
}
