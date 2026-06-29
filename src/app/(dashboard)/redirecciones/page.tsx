import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { RedirectsManager } from "@/components/redirects-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Redirecciones" };

export default async function RedireccionesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") redirect("/campaigns");
  return <RedirectsManager />;
}
