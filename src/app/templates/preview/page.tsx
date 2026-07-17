"use client";

import { useState } from "react";
import { LanderByTemplate } from "@/components/landing/lander-switch";
import type { LanderCampaign } from "@/components/landing/lander";
import type { LanderLocale } from "@/lib/lander-i18n";
import { LANDING_TEMPLATES } from "@/lib/landing-templates";

const LOCALES: { code: LanderLocale; label: string }[] = [
  { code: "sv", label: "🇸🇪 Svenska" },
  { code: "en", label: "🇬🇧 English" },
  { code: "fr", label: "🇫🇷 Français" },
];

function sampleCampaign(locale: LanderLocale): LanderCampaign {
  return {
    name: "FreeCash",
    slug: null,
    locale,
    colorPrimary: "#22e07a",
    colorBg: "#07080c",
    ctaUrl: "#",
    logoUrl: null,
    currencySymbol: "kr",
    currencyCode: "SEK",
    fontTitle: null,
    fontBody: null,
    offers: [
      { id: "1", name: "Block Blast", imageUrl: null, tag: "1 hr", badge: "TOP", amount: 32, rating: 4.9, note: null },
      { id: "2", name: "Coin Master", imageUrl: null, tag: "1 hr", badge: "HOT", amount: 24, rating: 4.8, note: null },
      { id: "3", name: "Monopoly Go", imageUrl: null, tag: "1 hr", badge: "NEW", amount: 18, rating: 4.9, note: null },
      { id: "4", name: "Bingo Blitz", imageUrl: null, tag: "1 hr", badge: "TOP", amount: 40, rating: 4.7, note: null },
    ],
  };
}

function initFrom(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

export default function TemplatePreviewPage() {
  const [template, setTemplate] = useState(() => initFrom("t", "freecash-v2"));
  const [locale, setLocale] = useState<LanderLocale>(() => initFrom("locale", "sv") as LanderLocale);

  const selectStyle: React.CSSProperties = {
    background: "#14161d", border: "1px solid rgba(255,255,255,0.16)", color: "#f4f6fb",
    borderRadius: 9, padding: "7px 10px", fontSize: 12.5, fontWeight: 600, outline: "none", cursor: "pointer",
  };

  return (
    <>
      {/* Barra de control (preview) */}
      <div style={{ position: "fixed", zIndex: 100, top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 12, background: "rgba(10,12,18,0.9)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(10px)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9aa3b2", letterSpacing: "0.04em", textTransform: "uppercase", paddingLeft: 4 }}>Preview</span>
        <select value={template} onChange={(e) => setTemplate(e.target.value)} style={selectStyle}>
          {LANDING_TEMPLATES.map((t) => <option key={t.slug} value={t.slug} style={{ background: "#14161d" }}>{t.name}</option>)}
        </select>
        <select value={locale} onChange={(e) => setLocale(e.target.value as LanderLocale)} style={selectStyle}>
          {LOCALES.map((l) => <option key={l.code} value={l.code} style={{ background: "#14161d" }}>{l.label}</option>)}
        </select>
      </div>

      <LanderByTemplate campaign={sampleCampaign(locale)} templateSlug={template} localeOverride={locale} />
    </>
  );
}
