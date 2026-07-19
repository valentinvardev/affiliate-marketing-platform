import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Campañas: header + grid de tarjetas con la misma anatomía que CampaignCard. */
export default function CampaignsLoading() {
  return (
    <SkelPage>
      <SkelHeader title={90} action={130} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
              <div style={{ height: 3, background: "var(--color-surface-overlay)" }} />
              {/* franja de oferta */}
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                <Skel w={24} h={24} r={6} />
                <Skel w={110} h={11} r={5} />
                <Skel w={46} h={11} r={5} style={{ marginLeft: "auto" }} />
              </div>
              {/* cuerpo */}
              <div className="px-4 py-3.5">
                <Skel w="55%" h={16} r={6} />
                <Skel w="82%" h={11} r={5} style={{ marginTop: 9 }} />
                <Skel w={66} h={11} r={5} style={{ marginTop: 9 }} />
                <div className="mt-3 flex items-center gap-1.5">
                  <Skel h={30} r={8} style={{ flex: 1 }} />
                  <Skel w={30} h={30} r={8} />
                  <Skel w={30} h={30} r={8} />
                </div>
              </div>
              {/* franja de VCC */}
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                <div className="flex items-center justify-between">
                  <Skel w={130} h={11} r={5} />
                  <Skel w={78} h={11} r={5} />
                </div>
                <Skel h={4} r={999} style={{ marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
