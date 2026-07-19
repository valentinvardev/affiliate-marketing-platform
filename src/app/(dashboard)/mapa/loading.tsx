import { Skel, SkelPage, SkelHeader } from "@/components/ui/skel";

/** Skeleton de Mapa: header + lienzo central. */
export default function MapaLoading() {
  return (
    <SkelPage>
      <SkelHeader title={170} />
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <Skel r={16} style={{ width: "100%", height: "100%", minHeight: 360 }} />
      </div>
    </SkelPage>
  );
}
