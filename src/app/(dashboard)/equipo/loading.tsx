import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Equipo: panel de invitación + lista de miembros. */
export default function EquipoLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={80} />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
        <div className="mb-5 rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
          <Skel w="40%" h={13} r={5} />
          <div className="mt-3 flex gap-2">
            <Skel h={38} r={8} style={{ flex: 1 }} />
            <Skel w={100} h={38} r={8} />
          </div>
        </div>
        <div className="stagger space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skel key={i} h={56} r={10} />
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
