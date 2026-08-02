import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, makeT, type AppLang } from "@/lib/i18n";

/** Idioma del panel para el request actual (server components). */
export async function getLang(): Promise<AppLang> {
  try {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    return isLang(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/** `t` para server components: const t = await getT(). */
export async function getT() {
  return makeT(await getLang());
}
