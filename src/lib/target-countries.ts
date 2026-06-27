export type TargetCountry = {
  id: string;        // ISO numérico (matchea feature.id del geojson, con padding)
  code: string;      // ISO-2 (banderas)
  name: string;      // español
  timezone: string;  // IANA
};

/** Países donde operamos (orden de carga; el sidebar reordena por estado). */
export const TARGET_COUNTRIES: TargetCountry[] = [
  { id: "826", code: "GB", name: "Inglaterra",     timezone: "Europe/London" },
  { id: "578", code: "NO", name: "Noruega",        timezone: "Europe/Oslo" },
  { id: "246", code: "FI", name: "Finlandia",      timezone: "Europe/Helsinki" },
  { id: "250", code: "FR", name: "Francia",        timezone: "Europe/Paris" },
  { id: "840", code: "US", name: "Estados Unidos", timezone: "America/New_York" },
  { id: "124", code: "CA", name: "Canadá",         timezone: "America/Toronto" },
  { id: "380", code: "IT", name: "Italia",         timezone: "Europe/Rome" },
  { id: "616", code: "PL", name: "Polonia",        timezone: "Europe/Warsaw" },
  { id: "056", code: "BE", name: "Bélgica",        timezone: "Europe/Brussels" },
  { id: "528", code: "NL", name: "Holanda",        timezone: "Europe/Amsterdam" },
  { id: "276", code: "DE", name: "Alemania",       timezone: "Europe/Berlin" },
  { id: "040", code: "AT", name: "Austria",        timezone: "Europe/Vienna" },
  { id: "756", code: "CH", name: "Suiza",          timezone: "Europe/Zurich" },
  { id: "752", code: "SE", name: "Suecia",         timezone: "Europe/Stockholm" },
];

/** Horario operable: 07:30 → 22:00 hora local. */
export const OP_START_MIN = 7 * 60 + 30;
export const OP_END_MIN = 22 * 60;
export const OP_LABEL = "07:30 – 22:00";

/** Hora local (minutos desde medianoche + etiqueta HH:MM) en la tz dada. */
export function localClock(tz: string, now: Date = new Date()): { minutes: number; label: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { minutes: hh * 60 + mm, label: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` };
}

export function isOperable(minutes: number): boolean {
  return minutes >= OP_START_MIN && minutes < OP_END_MIN;
}
