import { Skel, SkelPage } from "@/components/ui/skel";
import { CampaignFormSkeleton } from "../../_components/form-skeleton";

/** Skeleton de Editar campaña: header breadcrumb + studio del formulario. */
export default function EditCampaignLoading() {
  return (
    <SkelPage>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Skel w={110} h={13} r={6} />
        <span style={{ color: "var(--color-border)" }}>/</span>
        <Skel w={60} h={13} r={6} />
      </div>
      <CampaignFormSkeleton />
    </SkelPage>
  );
}
