"use client";

import { useState, useRef, useEffect } from "react";
import ReactCountryFlag from "react-country-flag";
import { Check } from "lucide-react";
import { LANGS, type AppLang } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";

/** Círculo con la bandera del idioma activo + dropdown para cambiarlo. */
export function LangSwitcher() {
  const { lang, t, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]!;

  function pick(code: AppLang) {
    setOpen(false);
    if (code !== lang) setLang(code);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={t("Cambiar idioma")}
        aria-label={t("Cambiar idioma")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full transition-colors"
        style={{
          border: `1px solid ${open ? "var(--color-border-focus)" : "var(--color-border)"}`,
          background: open ? "var(--color-surface-overlay)" : "transparent",
        }}
      >
        <ReactCountryFlag
          countryCode={current.countryCode}
          svg
          style={{ width: "1.45em", height: "1.45em", objectFit: "cover", borderRadius: "50%" }}
          title={current.label}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              {t("Idioma")}
            </span>
          </div>
          {LANGS.map((l) => {
            const on = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => pick(l.code)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: on ? "rgba(255,255,255,0.06)" : "transparent",
                  color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = on ? "rgba(255,255,255,0.06)" : "transparent"; }}
              >
                <ReactCountryFlag
                  countryCode={l.countryCode}
                  svg
                  style={{ width: "1.25em", height: "1.25em", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }}
                />
                <span className="flex-1">{l.label}</span>
                {on && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
