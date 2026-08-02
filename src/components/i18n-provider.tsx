"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANG, LANG_COOKIE, makeT, type AppLang } from "@/lib/i18n";

type Ctx = { lang: AppLang; t: (s: string) => string; setLang: (l: AppLang) => void };

const I18nCtx = createContext<Ctx>({
  lang: DEFAULT_LANG,
  t: (s) => s,
  setLang: () => undefined,
});

/**
 * Provee el idioma a los client components. El valor inicial lo pasa el layout
 * (server), que lo lee de la cookie — así no hay parpadeo de idioma al cargar.
 */
export function I18nProvider({ lang, children }: { lang: AppLang; children: ReactNode }) {
  const router = useRouter();

  const setLang = useCallback((next: AppLang) => {
    // Cookie a un año, en la raíz, para que también la vean los server components.
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // refresh() vuelve a renderizar los server components con el idioma nuevo.
    router.refresh();
  }, [router]);

  return (
    <I18nCtx.Provider value={{ lang, t: makeT(lang), setLang }}>
      {children}
    </I18nCtx.Provider>
  );
}

/** `const { t, lang, setLang } = useI18n()` dentro de client components. */
export function useI18n() {
  return useContext(I18nCtx);
}

/** Atajo cuando solo se necesita traducir. */
export function useT() {
  return useContext(I18nCtx).t;
}
