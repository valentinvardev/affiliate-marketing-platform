import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Finanzas: lista de paneles por usuario. */
export default function FinanzasLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={80} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="stagger space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skel w={36} h={36} r={999} />
                    <div>
                      <Skel w={110} h={12} r={5} />
                      <Skel w={70} h={10} r={5} style={{ marginTop: 7 }} />
                    </div>
                  </div>
                  <Skel w={90} h={22} r={7} />
                </div>
                <div className="mt-4 space-y-2">
                  <Skel h={36} r={8} />
                  <Skel h={36} r={8} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
