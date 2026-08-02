"use client";

import { DEFAULT_LANG, translate, type AppLang } from "@/lib/i18n";

/**
 * `t` para client components, sin hook.
 *
 * El idioma vive en una variable de módulo que setea I18nProvider durante su
 * render (antes de que rendericen los hijos). Es seguro porque en el navegador
 * hay un solo idioma activo a la vez — a diferencia del server, donde el estado
 * de módulo se compartiría entre requests concurrentes y por eso allá se usa
 * `await getT()`.
 *
 * Permite traducir dentro de subcomponentes anidados y helpers sin tener que
 * pasar `t` por props en toda la jerarquía.
 */
let current: AppLang = DEFAULT_LANG;

export function setClientLang(lang: AppLang) {
  current = lang;
}

export function getClientLang(): AppLang {
  return current;
}

export function t(text: string): string {
  return translate(current, text);
}
