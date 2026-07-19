import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Overview: hero de ingresos + tiles rápidos + actividad/atajos. */
export default function OverviewLoading() {
  return (
    <SkelPage>
      <SkelHeader title={180} action={80} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          {/* Hero */}
          <section className="rounded-2xl p-6 md:p-8" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
            <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
              <div>
                <Skel w={130} h={11} r={5} />
                <Skel w="70%" h={56} r={10} style={{ marginTop: 14 }} />
                <div className="mt-4 flex gap-3">
                  <Skel w={80} h={24} r={999} />
                  <Skel w={160} h={24} r={6} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Skel w={90} h={10} r={5} />
                  <Skel w={70} h={10} r={5} />
                </div>
                <Skel h={120} r={10} style={{ marginTop: 14 }} />
              </div>
            </div>
          </section>

          {/* Tiles rápidos */}
          <section className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} h={92} r={16} />
            ))}
          </section>

          {/* Actividad + atajos */}
          <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <Skel w={150} h={11} r={5} />
              <div className="mt-4 space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skel key={i} h={34} r={8} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Skel h={150} r={16} />
              <Skel h={110} r={16} />
            </div>
          </section>
        </div>
      </main>
    </SkelPage>
  );
}
