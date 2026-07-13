import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { AnglesManager } from "@/components/angles-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ángulos" };

export default async function AngulosPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") redirect("/campaigns");
  return <AnglesManager />;
}
