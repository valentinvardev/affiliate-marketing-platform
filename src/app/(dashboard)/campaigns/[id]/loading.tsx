import { Skel, SkelPage } from "@/components/ui/skel";

/** Skeleton de detalle de campaña: P&L + panel de gasto + tiles + conversiones. */
export default function CampaignDetailLoading() {
  return (
    <SkelPage>
      {/* Header breadcrumb */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Skel w={70} h={13} r={6} />
        <span style={{ color: "var(--color-border)" }}>/</span>
        <Skel w={8} h={8} r={999} />
        <Skel w={140} h={13} r={6} />
        <div className="ml-auto flex gap-1.5">
          <Skel w={28} h={28} r={8} />
          <Skel w={28} h={28} r={8} />
        </div>
      </div>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          {/* P&L + gasto */}
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-2xl p-6 md:p-7" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <Skel w={130} h={11} r={5} />
              <Skel w="55%" h={48} r={10} style={{ marginTop: 12 }} />
              <Skel w={200} h={11} r={5} style={{ marginTop: 14 }} />
              <Skel h={110} r={10} style={{ marginTop: 20 }} />
            </section>
            <Skel h={220} r={16} />
          </div>

          {/* Stat tiles */}
          <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                <Skel w={70} h={9} r={5} />
                <Skel w="55%" h={24} r={7} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>

          {/* Conversiones */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Skel w={110} h={11} r={5} />
              <Skel w={40} h={11} r={5} />
            </div>
            <div className="stagger space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skel key={i} h={54} r={10} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
