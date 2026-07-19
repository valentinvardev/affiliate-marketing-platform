import { Skel, SkelPage } from "@/components/ui/skel";
import { CampaignFormSkeleton } from "../_components/form-skeleton";

/** Skeleton de Nueva campaña: header breadcrumb + studio del formulario. */
export default function NewCampaignLoading() {
  return (
    <SkelPage>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Skel w={80} h={13} r={6} />
        <span style={{ color: "var(--color-border)" }}>/</span>
        <Skel w={110} h={13} r={6} />
      </div>
      <CampaignFormSkeleton />
    </SkelPage>
  );
}
