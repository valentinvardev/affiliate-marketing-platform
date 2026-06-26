import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import { Lander, type LanderCampaign } from "@/components/landing/lander";

export const dynamic = "force-dynamic";

/**
 * Preview real de la plantilla: renderiza el Lander tal cual, a partir de la
 * config codificada en `?c=` (base64url JSON). Solo para usuarios logueados
 * (se usa dentro de un iframe en el form de campaña).
 */
export default async function LandingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { c } = await searchParams;
  let campaign: LanderCampaign | null = null;
  if (c) {
    try {
      campaign = JSON.parse(Buffer.from(c, "base64url").toString("utf8")) as LanderCampaign;
    } catch { /* config inválida */ }
  }

  if (!campaign) {
    return (
      <div style={{ padding: 40, color: "#888", fontFamily: "system-ui", fontSize: 13 }}>
        Completá la campaña para ver el preview.
      </div>
    );
  }

  return <Lander campaign={campaign} />;
}
