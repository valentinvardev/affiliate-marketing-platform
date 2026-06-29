import {
  ArrowRight,
  Download,
  Gamepad2,
  Headphones,
  Lock,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
  UserPlus,
  Search,
  Zap,
  Wallet,
} from "lucide-react";
import { LanderFaq } from "@/components/landing/lander-faq";
import { getDict, type LanderLocale } from "@/lib/lander-i18n";
import { googleFontsHref, fontStack } from "@/lib/fonts";

const FEATURE_ICONS = [UserPlus, Search, Zap, Wallet];

/** Forma mínima de campaña que necesita el lander (slug o dominio la resuelven). */
export type LanderCampaign = {
  name: string;
  slug?: string | null;
  locale: string | null;
  colorPrimary: string;
  colorBg: string;
  ctaUrl: string;
  logoUrl: string | null;
  currencySymbol: string;
  fontTitle: string | null;
  fontBody: string | null;
  offers: {
    id: string;
    name: string;
    imageUrl: string | null;
    tag: string;
    badge: string;
    amount: number;
    rating: number;
    note: string | null;
  }[];
};

// Cascade background logos generated from offer images
function buildCascade(imageUrls: string[]) {
  if (!imageUrls.length) return [];
  return Array.from({ length: 18 }).map((_, i) => {
    const img = imageUrls[i % imageUrls.length]!;
    const left = (i * 37) % 100;
    const size = 36 + ((i * 13) % 36);
    const dur = 10 + ((i * 7) % 12);
    const delay = -((i * 1.7) % 18);
    const rotStart = -30 + ((i * 17) % 60);
    const rotEnd = rotStart + 60 + ((i * 11) % 80);
    const opacity = 0.18 + ((i * 0.04) % 0.22);
    return { img, left, size, dur, delay, rotStart, rotEnd, opacity, key: i };
  });
}

function landerStyles(primary: string, bg: string, fontTitle: string, fontBody: string) {
  return `
.lp {
  --lp: ${primary};
  --lb: ${bg};
  --lp-light: color-mix(in oklch, ${primary} 80%, white 20%);
  --lp-dark:  color-mix(in oklch, ${primary} 55%, black 45%);
  --lfg: oklch(0.98 0.003 0);
  --lmuted: oklch(0.70 0.04 260);
  background: var(--lb);
  min-height: 100svh;
  overflow-x: hidden;
  font-family: ${fontBody};
  -webkit-font-smoothing: antialiased;
  color: var(--lfg);
}
.lp * { box-sizing: border-box; }
.lp a { text-decoration: none; }
.lp button { font-family: inherit; }
.lp h1, .lp h2, .lp h3, .lp h4 { font-family: ${fontTitle}; letter-spacing: -0.02em; }

/* Glass card */
.lp .lg-card {
  background: linear-gradient(180deg, oklch(from var(--lb) calc(l + 0.08) c h / 0.6) 0%, oklch(from var(--lb) calc(l + 0.02) c h / 0.6) 100%);
  border: 1px solid oklch(1 0 0 / 6%);
  backdrop-filter: blur(8px);
}

/* Cascade falling logos */
@keyframes lCascadeFall {
  0%   { transform: translateY(-20vh) rotate(var(--rot-start, -20deg)) scale(0.85); opacity: 0; }
  10%  { opacity: var(--max-opacity, 0.4); }
  90%  { opacity: var(--max-opacity, 0.4); }
  100% { transform: translateY(120vh) rotate(var(--rot-end, 40deg)) scale(1); opacity: 0; }
}
.lp .l-cascade-logo {
  animation: lCascadeFall var(--dur, 14s) linear infinite;
  animation-delay: var(--delay, 0s);
  will-change: transform, opacity;
}

/* Glow blobs */
@keyframes lGlowDrift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  50%       { transform: translate(20px, -30px) scale(1.15); opacity: 0.8; }
}
.lp .l-glow-blob { animation: lGlowDrift 12s ease-in-out infinite; }

/* Pulse dot (live support indicator) */
@keyframes lPulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.85); }
}
.lp .l-pulse-dot { animation: lPulseDot 1.6s ease-in-out infinite; }

/* Sticky CTA pulse */
@keyframes lCtaPulse {
  0%, 100% { box-shadow: 0 10px 40px -10px color-mix(in oklch, ${primary} 70%, transparent); }
  50%       { box-shadow: 0 10px 50px -5px  color-mix(in oklch, ${primary} 90%, transparent); }
}
.lp .l-cta-pulse { animation: lCtaPulse 2s ease-in-out infinite; }

/* Hero CTA zoom */
@keyframes lCtaZoom {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.03); }
}
.lp .l-cta-zoom { animation: lCtaZoom 4s cubic-bezier(0.45,0.05,0.55,0.95) infinite; }

/* Fade in */
@keyframes lFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lp .l-fade-in { animation: lFadeIn 0.55s ease-out both; }
`;
}

export function Lander({ campaign }: { campaign: LanderCampaign }) {
  const locale = (campaign.locale as LanderLocale) ?? "en";
  const t = getDict(locale);
  const primary = campaign.colorPrimary;
  const bg = campaign.colorBg;
  const fontTitle = fontStack(campaign.fontTitle);
  const fontBody = fontStack(campaign.fontBody);
  const fontsHref = googleFontsHref([campaign.fontTitle ?? "Inter", campaign.fontBody ?? "Inter"]);
  const ctaUrl = campaign.ctaUrl;
  // Si hay slug, el CTA pasa por /api/click para registrar el click y redirigir a la oferta.
  const ctaHref = campaign.slug
    ? `/api/click?s1=${encodeURIComponent(campaign.slug)}&to=${encodeURIComponent(ctaUrl)}`
    : ctaUrl;
  const logoUrl = campaign.logoUrl;
  const currencySymbol = campaign.currencySymbol;

  const offers = campaign.offers.slice(0, 4);
  const offerImages = offers.map((o) => o.imageUrl).filter(Boolean) as string[];
  const cascadeItems = buildCascade(offerImages);

  function fmtAmount(n: number) {
    if (n === Math.floor(n)) return `${currencySymbol}${n}`;
    return `${currencySymbol}${n.toFixed(2)}`;
  }

  return (
    <>
      {/* Fuentes de la campaña (Google Fonts) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontsHref} />

      {/* Scoped styles injected per-page — prefixed with .lp to avoid collisions */}
      <style dangerouslySetInnerHTML={{ __html: landerStyles(primary, bg, fontTitle, fontBody) }} />

      <div className="lp">
        {/* ── Fixed background ── */}
        <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            opacity: 0.6,
          }}
        >
          {/* Glow blobs */}
          <div
            className="l-glow-blob"
            style={{
              position: "absolute",
              top: "-5rem",
              left: "-5rem",
              width: 288,
              height: 288,
              borderRadius: "50%",
              background: `radial-gradient(circle, color-mix(in oklch, ${primary} 35%, transparent) 0%, transparent 70%)`,
            }}
          />
          <div
            className="l-glow-blob"
            style={{
              position: "absolute",
              top: "33%",
              right: "-6rem",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: `radial-gradient(circle, oklch(0.55 0.18 280 / 0.3), transparent 70%)`,
              animationDelay: "3s",
            }}
          />
          <div
            className="l-glow-blob"
            style={{
              position: "absolute",
              bottom: 0,
              left: "25%",
              width: 288,
              height: 288,
              borderRadius: "50%",
              background: `radial-gradient(circle, color-mix(in oklch, ${primary} 25%, transparent) 0%, transparent 70%)`,
              animationDelay: "6s",
            }}
          />

          {/* Cascade logos */}
          {cascadeItems.map((g) => (
            <img
              key={g.key}
              src={g.img}
              alt=""
              aria-hidden
              className="l-cascade-logo"
              style={{
                position: "absolute",
                left: `${g.left}%`,
                width: g.size,
                height: g.size,
                top: 0,
                borderRadius: 12,
                objectFit: "cover",
                filter: "blur(2px)",
                // @ts-expect-error — CSS custom properties
                "--dur": `${g.dur}s`,
                "--delay": `${g.delay}s`,
                "--rot-start": `${g.rotStart}deg`,
                "--rot-end": `${g.rotEnd}deg`,
                "--max-opacity": g.opacity,
              }}
            />
          ))}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, transparent 30%, oklch(0.08 0.04 265 / 0.55) 75%)",
            }}
          />
        </div>

        {/* ── Scrollable page content ── */}
        <main
          className="l-fade-in"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 448,
            margin: "0 auto",
            padding: "24px 20px 112px",
          }}
        >
          {/* HERO */}
          <section style={{ textAlign: "center", paddingTop: 40 }}>
            {/* Logo */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={campaign.name}
                style={{ width: 64, height: 64, objectFit: "contain", margin: "0 auto", borderRadius: 12 }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto",
                  borderRadius: 12,
                  background: `color-mix(in oklch, ${primary} 20%, oklch(0.15 0.03 265))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Gamepad2 style={{ width: 32, height: 32, color: primary }} />
              </div>
            )}

            <h1
              style={{
                margin: "12px auto 0",
                maxWidth: "18ch",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--lfg)",
              }}
            >
              {t.hero.titleA}
              <span style={{ color: primary }}>{t.hero.titleHighlight}</span>
            </h1>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--lmuted)",
              }}
            >
              <Gamepad2 style={{ width: 14, height: 14, color: primary }} />
              {t.hero.subtitle}
            </div>

            {/* Main CTA button */}
            <a
              href={ctaHref}
              className="l-cta-zoom"
              style={{
                display: "block",
                width: "100%",
                marginTop: 24,
                position: "relative",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 9999,
                  background: "var(--lp-dark)",
                  transform: "translateY(4px)",
                  pointerEvents: "none",
                }}
              />
              <span
                className="l-cta-pulse"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  borderRadius: 9999,
                  borderTop: "1px solid rgba(255,255,255,0.3)",
                  background: "linear-gradient(180deg, var(--lp-light), var(--lp))",
                  padding: "16px 32px",
                  overflow: "hidden",
                }}
              >
                <Download style={{ width: 20, height: 20, color: "#fff", flexShrink: 0 }} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "-0.03em",
                    color: "#fff",
                  }}
                >
                  {t.hero.cta}
                </span>
                <ArrowRight style={{ width: 20, height: 20, color: "rgba(255,255,255,0.85)" }} strokeWidth={2.5} />
              </span>
            </a>

            {/* Trust badges */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px 12px",
                fontSize: 12,
                color: "var(--lmuted)",
              }}
            >
              {t.hero.badges.map((b) => (
                <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <span style={{ color: primary }}>✓</span> {b}
                </span>
              ))}
            </div>
          </section>

          {/* POPULAR OFFERS */}
          {offers.length > 0 && (
            <section style={{ marginTop: 56 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                    color: "var(--lmuted)",
                  }}
                >
                  {t.popular.eyebrow}
                </div>
                <h2
                  style={{
                    marginTop: 8,
                    fontSize: 28,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    color: "var(--lfg)",
                  }}
                >
                  {t.popular.titleA}
                  <span style={{ color: primary }}>{t.popular.titleHighlight}</span>
                </h2>
              </div>

              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                }}
              >
                {offers.map((offer) => (
                  <a
                    key={offer.id}
                    href={ctaHref}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      borderRadius: 16,
                      border: "1px solid oklch(1 0 0 / 10%)",
                      background: "oklch(1 0 0 / 4%)",
                      backdropFilter: "blur(8px)",
                      textDecoration: "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {/* Offer image */}
                    <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                      {offer.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.imageUrl}
                          alt={offer.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.1)" }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(135deg, color-mix(in oklch, ${primary} 25%, oklch(0.12 0.04 265)), oklch(0.14 0.04 265))`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Gamepad2 style={{ width: 40, height: 40, color: primary, opacity: 0.6 }} />
                        </div>
                      )}
                      {/* Badge */}
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          borderRadius: 6,
                          background: primary,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "oklch(0.98 0.003 0)",
                        }}
                      >
                        {offer.badge}
                      </span>
                      {/* Tag */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.6)",
                          padding: "4px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <Trophy style={{ width: 12, height: 12, color: primary }} />
                        {offer.tag}
                      </span>
                    </div>

                    {/* Offer info */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: "var(--lfg)" }}>
                        {offer.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--lmuted)", marginTop: 2 }}>
                        {t.popular.perHour}
                      </div>

                      <div style={{ marginTop: 8, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--lmuted)" }}>
                            {t.popular.upTo}
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: primary }}>
                            {fmtAmount(offer.amount)}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--lfg)" }}>
                          <Star style={{ width: 14, height: 14, fill: "#fbbf24", color: "#fbbf24" }} />
                          {offer.rating}
                        </div>
                      </div>

                      {offer.note && (
                        <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--lmuted)" }}>
                          {offer.note}
                        </div>
                      )}

                      {/* Per-card CTA */}
                      <div style={{ position: "relative", marginTop: 12 }}>
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 9999,
                            background: "var(--lp-dark)",
                            transform: "translateY(2px)",
                            pointerEvents: "none",
                          }}
                        />
                        <span
                          style={{
                            position: "relative",
                            display: "inline-flex",
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            borderRadius: 9999,
                            borderTop: "1px solid rgba(255,255,255,0.3)",
                            background: "linear-gradient(180deg, var(--lp-light), var(--lp))",
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#fff",
                          }}
                        >
                          {t.popular.cta}
                          <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* FEATURES */}
          <section style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
            {t.features.map((f, idx) => {
              const Icon = FEATURE_ICONS[idx] ?? UserPlus;
              return (
                <a
                  key={f.title}
                  href={ctaHref}
                  className="lg-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    borderRadius: 9999,
                    padding: "12px 16px",
                    textDecoration: "none",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: `color-mix(in oklch, ${primary} 15%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon style={{ width: 20, height: 20, color: primary }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--lfg)" }}>{f.title}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.4, color: "var(--lmuted)" }}>{f.body}</div>
                  </div>
                </a>
              );
            })}
          </section>

          {/* TESTIMONIALS */}
          <section style={{ marginTop: 56, textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color: "var(--lmuted)",
              }}
            >
              {t.testimonialsBlock.eyebrow}
            </div>
            <h2
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--lfg)",
              }}
            >
              {t.testimonialsBlock.titleA}
              <span style={{ color: primary }}>{t.testimonialsBlock.titleHighlight}</span>
              {t.testimonialsBlock.titleB}
            </h2>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              {t.testimonialsBlock.items.map((tm) => (
                <div
                  key={tm.name}
                  className="lg-card"
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Letter avatar */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: "50%",
                        background: `color-mix(in oklch, ${primary} 20%, oklch(0.15 0.04 265))`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        color: primary,
                      }}
                    >
                      {tm.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--lfg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tm.name}
                          </span>
                          <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, color: primary }} />
                          <span style={{ fontSize: 12, color: "var(--lmuted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            · {tm.city}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: primary, whiteSpace: "nowrap" }}>
                          {tm.amount}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--lmuted)" }}>
                        <span style={{ display: "flex" }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} style={{ width: 12, height: 12, fill: "#fbbf24", color: "#fbbf24" }} />
                          ))}
                        </span>
                        <span>{tm.time}</span>
                      </div>
                      <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: "var(--lmuted)" }}>
                        {tm.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginTop: 64 }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--lmuted)",
                }}
              >
                {t.faq.eyebrow}
              </div>
              <h2
                style={{
                  marginTop: 8,
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  color: "var(--lfg)",
                }}
              >
                {t.faq.title}
              </h2>
            </div>
            <LanderFaq items={t.faq.items} />
          </section>

          {/* FOOTER */}
          <footer style={{ marginTop: 48, textAlign: "center" }}>
            {/* Live support badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                border: "1px solid rgba(52,211,153,0.3)",
                background: "rgba(52,211,153,0.1)",
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#34d399",
              }}
            >
              <Headphones style={{ width: 14, height: 14 }} />
              {t.footer.support}
              <span
                className="l-pulse-dot"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
            </div>

            {/* Device + no card */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--lmuted)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 9999,
                  border: "1px solid oklch(1 0 0 / 10%)",
                  background: "oklch(1 0 0 / 4%)",
                  padding: "4px 10px",
                }}
              >
                <Smartphone style={{ width: 12, height: 12, color: primary }} />
                <span style={{ fontWeight: 600, color: "var(--lfg)" }}>{t.footer.devices}</span>
              </span>
              <span>{t.footer.noCard}</span>
            </div>

            {/* Trustpilot */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: "#34d399" }}>
                <Star style={{ width: 12, height: 12, fill: "#34d399", color: "#34d399" }} />
                Trustpilot
              </span>
              <span style={{ display: "flex" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} style={{ width: 12, height: 12, fill: "#34d399", color: "#34d399" }} />
                ))}
              </span>
              <span style={{ fontWeight: 700, color: "var(--lfg)" }}>4.8</span>
              <span style={{ color: "var(--lmuted)" }}>{t.footer.reviews}</span>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "var(--lmuted)" }}>
              {t.footer.payments}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                fontSize: 10,
                color: "oklch(0.7 0.04 260 / 70%)",
              }}
            >
              <span>{t.footer.legal}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Lock style={{ width: 10, height: 10 }} /> {t.footer.ssl}
              </span>
              <span>{t.footer.terms}</span>
            </div>
          </footer>
        </main>

        {/* ── Sticky bottom CTA ── */}
        <a
          href={ctaHref}
          style={{
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: 50,
            maxWidth: 448,
            margin: "0 auto",
            display: "block",
            outline: "none",
            textDecoration: "none",
          }}
        >
          <div style={{ position: "relative", margin: 12 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background: "var(--lp-dark)",
                transform: "translateY(4px)",
                pointerEvents: "none",
              }}
            />
            <div
              className="l-cta-pulse"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderRadius: 9999,
                borderTop: "1px solid rgba(255,255,255,0.3)",
                background: "linear-gradient(180deg, var(--lp-light), var(--lp))",
                padding: "12px 12px 12px 16px",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Download style={{ width: 20, height: 20, color: "#fff", flexShrink: 0 }} strokeWidth={2.5} />
                <div style={{ textAlign: "left", lineHeight: 1.25 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
                    {t.sticky.title}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(240,253,244,0.9)" }}>
                    {t.sticky.sub}
                  </div>
                </div>
              </div>
              <span
                style={{
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(74,222,128,0.4)",
                  padding: "6px 12px",
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                  whiteSpace: "nowrap",
                }}
              >
                {t.sticky.badge}
              </span>
            </div>
          </div>
        </a>
      </div>
    </>
  );
}
