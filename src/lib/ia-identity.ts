import "server-only";
import type { PrismaClient } from "../../generated/prisma";

/**
 * Identidad de la IA del chat global, editable desde Admin.
 * Vive en AppConfig para poder cambiarla sin deploy.
 */
export const IA_KEYS = {
  name: "ia_name",
  avatar: "ia_avatar",
  persona: "ia_persona",
} as const;

export const IA_DEFAULTS = {
  name: "IA",
  avatar: null as string | null,
  persona:
    "Sos parte del equipo de TapSur (media buying de TikTok Ads, nicho get-paid-to-play). " +
    "Hablás en español rioplatense, directo y sin vueltas.",
};

export type IaIdentity = { name: string; avatar: string | null; persona: string };

export async function getIaIdentity(db: PrismaClient): Promise<IaIdentity> {
  try {
    const rows = await db.appConfig.findMany({
      where: { key: { in: Object.values(IA_KEYS) } },
    });
    const by = new Map(rows.map((r) => [r.key, r.value]));
    return {
      name: by.get(IA_KEYS.name)?.trim() || IA_DEFAULTS.name,
      avatar: by.get(IA_KEYS.avatar)?.trim() || null,
      persona: by.get(IA_KEYS.persona)?.trim() || IA_DEFAULTS.persona,
    };
  } catch {
    return { ...IA_DEFAULTS };
  }
}
