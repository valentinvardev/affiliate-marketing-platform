import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Tarjetas virtuales: grid de tarjetas con proporción de VCC real. */
export default function CardsLoading() {
  return (
    <SkelPage>
      <SkelHeader icon title={140} action={110} />
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="stagger grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                {/* Tarjeta visual (aspect 1.586/1) */}
                <div className="skel aspect-[1.586/1] w-full" style={{ borderRadius: 16 }} />
                {/* Meta debajo */}
                <div className="flex items-center justify-between">
                  <Skel w="45%" h={12} r={5} />
                  <Skel w={60} h={12} r={5} />
                </div>
                <Skel h={4} r={999} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </SkelPage>
  );
}
