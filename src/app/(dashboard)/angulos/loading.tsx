import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Ángulos: selector de país + tabs + galería. */
export default function AngulosLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={80} />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-8">
        {/* Selector de país */}
        <Skel h={64} r={12} />
        {/* Tabs */}
        <div className="flex gap-2">
          <Skel w={150} h={34} r={9} />
          <Skel w={180} h={34} r={9} />
        </div>
        {/* Galería */}
        <div className="stagger grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skel key={i} r={12} style={{ aspectRatio: "1 / 1", width: "100%" }} />
          ))}
        </div>
      </main>
    </SkelPage>
  );
}
