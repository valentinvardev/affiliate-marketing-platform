import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Ofertas: header + barra de búsqueda/filtros + grid de tarjetas. */
export default function OffersLoading() {
  return (
    <SkelPage>
      <SkelHeader title={70} />
      {/* Barra de búsqueda + filtros */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-3 md:gap-3 md:px-8" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <Skel h={38} r={8} style={{ flex: 1 }} />
        <Skel w={120} h={38} r={8} className="hidden md:block" />
        <Skel w={120} h={38} r={8} className="hidden md:block" />
      </div>
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <div className="flex items-center gap-3">
                <Skel w={44} h={44} r={10} />
                <div className="flex-1">
                  <Skel w="70%" h={13} r={5} />
                  <Skel w={50} h={10} r={5} style={{ marginTop: 7 }} />
                </div>
              </div>
              <Skel h={11} r={5} />
              <Skel w="80%" h={11} r={5} />
              <div className="mt-1 flex items-center justify-between">
                <Skel w={60} h={12} r={5} />
                <Skel w={72} h={28} r={8} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
