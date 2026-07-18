import { LANDING_TEMPLATES } from "@/lib/landing-templates";
import { ExternalLink, Layout } from "lucide-react";

const LOCS = [
  { code: "sv", label: "🇸🇪 SV" }, { code: "en", label: "🇬🇧 EN" }, { code: "de", label: "🇩🇪 DE" },
  { code: "fr", label: "🇫🇷 FR" }, { code: "nl", label: "🇳🇱 NL" }, { code: "no", label: "🇳🇴 NO" },
  { code: "fi", label: "🇫🇮 FI" }, { code: "pl", label: "🇵🇱 PL" }, { code: "it", label: "🇮🇹 IT" },
];

export function AdminTemplatesTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <div className="mb-1 flex items-center gap-2">
          <Layout className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Plantillas de landing</h2>
        </div>
        <p className="mb-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Elegís la plantilla por campaña (en el formulario de creación/edición, campo <b>Plantilla</b>). Acá previsualizás cada una en cada idioma con datos de ejemplo.
        </p>

        <div className="space-y-3">
          {LANDING_TEMPLATES.map((t) => (
            <div key={t.slug} className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t.name}
                  <span className="ml-2 rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "var(--color-surface-raised)", color: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>{t.slug}</span>
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{t.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LOCS.map((l) => (
                  <a key={l.code} href={`/templates/preview?t=${t.slug}&locale=${l.code}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                    {l.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
