import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Tutoriales: header + buscador + grilla de videos 16:9. */
export default function TutorialesLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={90} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Skel h={38} r={8} style={{ flex: 1, minWidth: 220 }} />
          <Skel w={70} h={32} r={8} />
          <Skel w={90} h={32} r={8} />
        </div>
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
              <div className="skel" style={{ aspectRatio: "16 / 9", borderRadius: 0 }} />
              <div className="p-3.5">
                <Skel h={13} w="80%" r={5} />
                <Skel h={11} w="95%" r={5} style={{ marginTop: 9 }} />
                <Skel h={11} w="60%" r={5} style={{ marginTop: 6 }} />
                <div className="mt-3 flex gap-3">
                  <Skel h={10} w={34} r={5} />
                  <Skel h={10} w={34} r={5} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
