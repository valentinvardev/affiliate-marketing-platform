import type { PrismaClient } from "../../generated/prisma";

/** Límites por defecto de tarjetas virtuales (por usuario). Editables por el admin. */
export const DEFAULT_MAX_CARDS_PER_USER = 3;
export const DEFAULT_DAILY_SPEND_CAP_USD = 100;

export const LIMIT_KEY_MAX_CARDS = "vcc_max_cards";
export const LIMIT_KEY_DAILY_CAP = "vcc_daily_cap";

/** Lee los límites configurados en AppConfig, con fallback a los defaults. */
export async function getLimits(db: PrismaClient): Promise<{ maxCards: number; dailyCap: number }> {
  const rows = await db.appConfig.findMany({
    where: { key: { in: [LIMIT_KEY_MAX_CARDS, LIMIT_KEY_DAILY_CAP] } },
  });
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  const maxCards = parseInt(get(LIMIT_KEY_MAX_CARDS) ?? "", 10) || DEFAULT_MAX_CARDS_PER_USER;
  const dailyCap = parseFloat(get(LIMIT_KEY_DAILY_CAP) ?? "") || DEFAULT_DAILY_SPEND_CAP_USD;
  return { maxCards: Math.max(1, maxCards), dailyCap: Math.max(1, dailyCap) };
}

/** Día actual en formato YYYY-MM-DD (para el baseline diario del gasto). */
export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
