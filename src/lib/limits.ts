/** Límites por defecto de tarjetas virtuales (por usuario). */
export const MAX_CARDS_PER_USER = 3;
export const DAILY_SPEND_CAP_USD = 100;

/** Día actual en formato YYYY-MM-DD (para el baseline diario del gasto). */
export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
