import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Redirecciones: fila de alta + lista de reglas. */
export default function RedireccionesLoading() {
  return (
    <SkelPage>
      <SkelHeader title={120} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-8">
        <div className="mb-4 flex gap-2">
          <Skel h={40} r={8} style={{ flex: 1 }} />
          <Skel w={90} h={40} r={8} />
        </div>
        <div className="stagger space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skel key={i} h={52} r={10} />
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
