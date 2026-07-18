// Páginas "seguras" (tiendas de ropa medianamente conocidas) a las que redirige
// el cloaker de campaña cuando está activado. Marcas no obvias (no Nike/Adidas).
export const DEFAULT_WHITEPAGES = [
  "https://www.cos.com",
  "https://www.mango.com",
  "https://www.massimodutti.com",
  "https://www.stories.com",
  "https://www.arket.com",
  "https://www.weekday.com",
  "https://www.monki.com",
  "https://www.bershka.com",
];

/** Elige una whitepage al azar: usa la lista de la campaña si tiene, si no la default. */
export function pickWhitepage(list?: string[] | null): string {
  const pool = (list && list.length ? list : DEFAULT_WHITEPAGES).filter(Boolean);
  if (!pool.length) return DEFAULT_WHITEPAGES[0]!;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
