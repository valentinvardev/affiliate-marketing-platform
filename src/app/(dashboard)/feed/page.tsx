import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { FeedView } from "@/components/feed/feed-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  return <FeedView isAdmin={session?.user?.role === "admin"} />;
}
