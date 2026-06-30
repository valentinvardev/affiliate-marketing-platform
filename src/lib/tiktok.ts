/** Extrae el id numérico de un post de TikTok (video o photo). */
export function tiktokId(url: string): string | null {
  const m = /\/(?:video|photo)\/(\d+)/.exec(url);
  return m?.[1] ?? null;
}

/** ¿Es un carrusel (foto-mode)? */
export function isTiktokCarousel(url: string): boolean {
  return /\/photo\//.test(url);
}

/** URL de embed oficial por id (sirve para video y carrusel). */
export function tiktokEmbedSrc(url: string): string | null {
  const id = tiktokId(url);
  return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
}

/** oEmbed de TikTok (server-side): thumbnail, autor, título. Best-effort. */
export async function fetchTiktokOembed(url: string): Promise<{ thumbnailUrl: string | null; authorName: string | null; title: string | null }> {
  const empty = { thumbnailUrl: null, authorName: null, title: null };
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return empty;
    const d = (await res.json()) as { thumbnail_url?: string; author_name?: string; title?: string };
    return { thumbnailUrl: d.thumbnail_url ?? null, authorName: d.author_name ?? null, title: d.title ?? null };
  } catch {
    return empty;
  }
}
