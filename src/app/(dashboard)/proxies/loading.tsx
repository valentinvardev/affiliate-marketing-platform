import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Proxies: métricas 3-col + lista. */
export default function ProxiesLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={80} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-8">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skel key={i} h={64} r={10} />
          ))}
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
