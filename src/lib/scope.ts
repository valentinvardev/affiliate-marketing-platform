import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Scope de datos por usuario.
 * - admin  → ve todo (slugs = null).
 * - user   → ve solo las conversiones de SUS campañas (slugs propios).
 * - sin sesión → no ve nada.
 */
export async function getScope(): Promise<{ isAdmin: boolean; userId: string | null; slugs: string[] | null }> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = session?.user?.id ?? null;

  if (role === "admin") return { isAdmin: true, userId, slugs: null };
  if (!userId) return { isAdmin: false, userId: null, slugs: [] };

  const camps = await db.campaign.findMany({ where: { ownerId: userId }, select: { slug: true } });
  return { isAdmin: false, userId, slugs: camps.map((c) => c.slug) };
}

/** Where para Conversion según el scope (slugs=null → sin filtro). */
export function convWhere(slugs: string[] | null): { s1?: { in: string[] } } {
  if (slugs === null) return {};
  return { s1: { in: slugs.length ? slugs : ["__no-match__"] } };
}

/** Where para Campaign según el scope (admin → todas; user → propias). */
export function campaignWhere(isAdmin: boolean, userId: string | null): { ownerId?: string } {
  if (isAdmin) return {};
  return { ownerId: userId ?? "__no-match__" };
}
