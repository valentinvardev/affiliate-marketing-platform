import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Estadísticas: tabs de rango + 4 métricas + gráfico + lista de conversiones. */
export default function StatsLoading() {
  return (
    <SkelPage>
      <SkelHeader title={110} />
      <main className="flex-1 space-y-6 px-4 py-6 md:px-8">
        {/* Tabs de rango */}
        <div className="flex flex-wrap gap-2">
          {[70, 48, 52, 60, 62].map((w, i) => (
            <Skel key={i} w={w} h={30} r={8} />
          ))}
        </div>

        {/* Métricas */}
        <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <div className="flex items-center justify-between">
                <Skel w={70} h={11} r={5} />
                <Skel w={14} h={14} r={4} />
              </div>
              <Skel w="60%" h={26} r={7} style={{ marginTop: 14 }} />
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <Skel h={260} r={12} />

        {/* Lista de conversiones */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Skel w={110} h={11} r={5} />
            <Skel w={34} h={18} r={999} />
          </div>
          <div className="stagger space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skel key={i} h={54} r={10} />
            ))}
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
