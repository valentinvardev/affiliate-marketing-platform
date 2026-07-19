import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Sparks: grid de tarjetas con miniatura. */
export default function SparksLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={70} action={110} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <div className="skel" style={{ height: 150, borderRadius: 0 }} />
              <div className="flex flex-col gap-2 p-3">
                <Skel w="70%" h={13} r={5} />
                <Skel w="45%" h={10} r={5} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
