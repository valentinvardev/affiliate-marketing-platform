import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de la Feed: header + composer + posts. */
export default function FeedLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={70} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Skel h={110} r={12} />
          <div className="stagger mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                <div className="flex items-center gap-2.5">
                  <Skel w={36} h={36} r={999} />
                  <div className="flex-1">
                    <Skel h={12} w="35%" r={5} />
                    <Skel h={10} w="20%" r={5} style={{ marginTop: 6 }} />
                  </div>
                  <Skel w={44} h={24} r={6} />
                </div>
                <Skel h={12} w="92%" r={5} style={{ marginTop: 14 }} />
                <Skel h={12} w="70%" r={5} style={{ marginTop: 7 }} />
                <Skel h={190} r={10} style={{ marginTop: 12 }} />
                <div className="mt-3 flex gap-4">
                  <Skel h={14} w={42} r={5} />
                  <Skel h={14} w={42} r={5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
