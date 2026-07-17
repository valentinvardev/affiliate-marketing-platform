import {
  ArrowRight, ShieldCheck, Zap, Wallet, Star, Check, Download, BadgeCheck, Lock, TrendingUp,
} from "lucide-react";
import { getDict, type LanderLocale } from "@/lib/lander-i18n";
import { googleFontsHref } from "@/lib/fonts";
import { formatMoneyFromUsd } from "@/lib/currencies";
import type { LanderCampaign } from "@/components/landing/lander";

/* FreeCash v2 — vibe fintech/SaaS: fondo oscuro premium, tipografía Space Grotesk + Inter,
   layout serio y optimizado a conversión. El color de acento sale de la campaña. */

const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const BODY = "'Inter', system-ui, -apple-system, sans-serif";

function styles(acc: string) {
  return `
.v2 {
  --acc: ${acc};
  --bg: #07080c;
  --fg: #f4f6fb;
  --muted: #9aa3b2;
  --subtle: #626b7a;
  --card: rgba(255,255,255,0.028);
  --card-2: rgba(255,255,255,0.05);
  --border: rgba(255,255,255,0.08);
  --border-2: rgba(255,255,255,0.14);
  position: relative;
  min-height: 100vh;
  color: var(--fg);
  background: var(--bg);
  font-family: ${BODY};
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.v2 * { box-sizing: border-box; }
.v2 h1, .v2 h2, .v2 h3 { font-family: ${DISPLAY}; letter-spacing: -0.03em; line-height: 1.04; margin: 0; }
.v2 p { margin: 0; }
.v2 a { text-decoration: none; color: inherit; }

/* Fondo impactante: glow de acento + grilla sutil + viñeta */
.v2::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(90% 60% at 50% -8%, color-mix(in oklch, var(--acc) 40%, transparent) 0%, transparent 55%),
    radial-gradient(60% 50% at 88% 8%, color-mix(in oklch, var(--acc) 18%, transparent) 0%, transparent 60%),
    radial-gradient(70% 60% at 10% 110%, color-mix(in oklch, var(--acc) 12%, transparent) 0%, transparent 60%);
}
.v2::after {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(100% 70% at 50% 0%, #000 30%, transparent 75%);
}
.v2 > * { position: relative; z-index: 1; }

.v2-wrap { max-width: 1140px; margin: 0 auto; padding: 0 22px; }

/* Botones */
.v2-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  font-family: ${DISPLAY}; font-weight: 600; font-size: 16px; letter-spacing: -0.01em;
  padding: 15px 26px; border-radius: 13px; color: #05070c; border: none; cursor: pointer;
  background: linear-gradient(180deg, color-mix(in oklch, var(--acc) 92%, white 8%), var(--acc));
  box-shadow: 0 10px 30px -8px color-mix(in oklch, var(--acc) 70%, transparent), inset 0 1px 0 rgba(255,255,255,0.35);
  transition: transform .15s ease, box-shadow .15s ease;
}
.v2-cta:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -8px color-mix(in oklch, var(--acc) 80%, transparent), inset 0 1px 0 rgba(255,255,255,0.4); }
.v2-ghost {
  display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px;
  padding: 11px 18px; border-radius: 11px; color: var(--fg);
  background: var(--card-2); border: 1px solid var(--border-2); transition: background .15s ease;
}
.v2-ghost:hover { background: rgba(255,255,255,0.09); }

.v2-eyebrow {
  display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600;
  letter-spacing: 0.02em; color: var(--muted); padding: 7px 14px; border-radius: 999px;
  background: var(--card); border: 1px solid var(--border);
}
.v2-accent { color: var(--acc); }
.v2-grad {
  background: linear-gradient(100deg, var(--fg) 30%, color-mix(in oklch, var(--acc) 85%, white));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.v2-card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; }

/* Animaciones */
@keyframes v2up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes v2float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes v2pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
.v2-rise { animation: v2up .7s cubic-bezier(.2,.7,.2,1) both; }
.v2-d1 { animation-delay: .06s; } .v2-d2 { animation-delay: .14s; } .v2-d3 { animation-delay: .22s; } .v2-d4 { animation-delay: .3s; }

/* Hero */
.v2-nav { display: flex; align-items: center; padding: 20px 0; }
.v2-hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 46px; align-items: center; padding: 34px 0 56px; }
.v2-h1 { font-size: clamp(38px, 6vw, 62px); font-weight: 700; }
.v2-sub { margin-top: 20px; font-size: 18px; line-height: 1.55; color: var(--muted); max-width: 30ch; }
.v2-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 26px; }
.v2-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--fg); padding: 8px 13px; border-radius: 10px; background: var(--card); border: 1px solid var(--border); }

/* Earnings card (signature) */
.v2-earn { animation: v2float 7s ease-in-out infinite; }
.v2-earn-inner {
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));
  border: 1px solid var(--border-2); border-radius: 24px; padding: 24px;
  box-shadow: 0 40px 90px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
}
.v2-bal { font-family: ${DISPLAY}; font-weight: 700; font-size: 46px; letter-spacing: -0.03em; margin-top: 6px; }
.v2-prog { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; margin-top: 8px; }
.v2-prog span { display: block; height: 100%; width: 78%; border-radius: 999px; background: linear-gradient(90deg, color-mix(in oklch, var(--acc) 70%, white), var(--acc)); }

/* Secciones */
.v2-sec { padding: 60px 0; }
.v2-h2 { font-size: clamp(28px, 4.4vw, 42px); font-weight: 700; }
.v2-lead { margin-top: 12px; color: var(--muted); font-size: 16px; max-width: 52ch; }

.v2-offers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 30px; }
.v2-offer { padding: 16px; text-align: center; transition: transform .18s ease, border-color .18s ease; }
.v2-offer:hover { transform: translateY(-4px); border-color: var(--border-2); }
.v2-offer-img { width: 62px; height: 62px; border-radius: 16px; object-fit: cover; margin: 4px auto 12px; border: 1px solid var(--border); }
.v2-amt { font-family: ${DISPLAY}; font-weight: 700; font-size: 22px; color: var(--acc); }

.v2-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 30px; }
.v2-step { padding: 22px 18px; }
.v2-num { font-family: ${DISPLAY}; font-weight: 700; font-size: 15px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: color-mix(in oklch, var(--acc) 16%, transparent); color: var(--acc); border: 1px solid color-mix(in oklch, var(--acc) 30%, transparent); }

.v2-tst { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 30px; }
.v2-tcard { padding: 22px; display: flex; flex-direction: column; gap: 12px; }

.v2-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; border-radius: 20px; overflow: hidden; border: 1px solid var(--border); background: var(--border); }
.v2-stat { background: #090b11; padding: 30px 22px; text-align: center; }
.v2-stat b { font-family: ${DISPLAY}; font-weight: 700; font-size: clamp(26px,3.5vw,38px); display: block; }

.v2-faq details { border: 1px solid var(--border); border-radius: 14px; margin-bottom: 10px; background: var(--card); overflow: hidden; }
.v2-faq summary { list-style: none; cursor: pointer; padding: 18px 20px; font-weight: 600; font-size: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.v2-faq summary::-webkit-details-marker { display: none; }
.v2-faq summary::after { content: "+"; font-size: 22px; color: var(--acc); font-weight: 400; }
.v2-faq details[open] summary::after { content: "–"; }
.v2-faq p { padding: 0 20px 18px; color: var(--muted); line-height: 1.6; font-size: 14.5px; }

.v2-final { text-align: center; padding: 30px; border-radius: 26px; border: 1px solid var(--border-2);
  background: radial-gradient(120% 140% at 50% 0%, color-mix(in oklch, var(--acc) 22%, transparent), transparent 60%), rgba(255,255,255,0.02); }

.v2-foot { border-top: 1px solid var(--border); padding: 34px 0 120px; color: var(--subtle); font-size: 13px; }
.v2-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.v2-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 9px; background: var(--card); border: 1px solid var(--border); color: var(--muted); font-size: 12.5px; font-weight: 500; }

/* Sticky mobile CTA */
.v2-sticky { position: fixed; z-index: 40; left: 12px; right: 12px; bottom: 12px; display: none;
  align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px;
  background: rgba(12,14,20,0.92); border: 1px solid var(--border-2); backdrop-filter: blur(10px);
  box-shadow: 0 20px 50px -12px rgba(0,0,0,0.7); }

@media (max-width: 880px) {
  .v2-hero { grid-template-columns: 1fr; gap: 30px; padding-bottom: 34px; }
  .v2-offers { grid-template-columns: repeat(2, 1fr); }
  .v2-steps { grid-template-columns: repeat(2, 1fr); }
  .v2-tst { grid-template-columns: 1fr; }
  .v2-stats { grid-template-columns: 1fr; }
  .v2-sub { max-width: none; }
  .v2-sticky { display: flex; }
  .v2-foot { padding-bottom: 100px; }
}
`;
}

function hueFromName(name: string): number {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
/** Tile tipo app-icon generado (fallback cuando el juego no tiene logo). */
function GameTile({ name, size }: { name: string; size: number }) {
  const h = hueFromName(name || "?");
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.42, color: "#fff", background: `linear-gradient(140deg, hsl(${h} 78% 56%), hsl(${(h + 45) % 360} 74% 44%))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.14)" }}>
      {(name.charAt(0) || "•").toUpperCase()}
    </div>
  );
}

export function LanderV2({ campaign, localeOverride }: { campaign: LanderCampaign; localeOverride?: LanderLocale }) {
  const locale = localeOverride ?? (campaign.locale as LanderLocale) ?? "sv";
  const t = getDict(locale);
  const acc = campaign.colorPrimary || "#22e07a";
  const fontsHref = googleFontsHref(["Space Grotesk", "Inter"]);
  const ctaHref = campaign.slug ? `/api/click?s1=${encodeURIComponent(campaign.slug)}&to=${encodeURIComponent(campaign.ctaUrl)}` : campaign.ctaUrl;
  const offers = campaign.offers.slice(0, 4);
  const money = (n: number) => (campaign.currencyCode ? formatMoneyFromUsd(n, campaign.currencyCode) : `${campaign.currencySymbol}${n}`);
  const topAmount = offers.length ? Math.max(...offers.map((o) => o.amount)) : 25;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={fontsHref} />
      <style dangerouslySetInnerHTML={{ __html: styles(acc) }} />

      <div className="v2">
        <div className="v2-wrap">
          {/* Nav */}
          <nav className="v2-nav">
            {campaign.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.logoUrl} alt={campaign.name} style={{ height: 32, width: "auto", objectFit: "contain" }} />
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 17, color: "#05070c", background: `linear-gradient(180deg, color-mix(in oklch, ${acc} 92%, white), ${acc})` }}>{(campaign.name.charAt(0) || "F").toUpperCase()}</span>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>{campaign.name}</span>
              </span>
            )}
            <a href={ctaHref} className="v2-ghost" style={{ marginLeft: "auto" }}>
              <Download style={{ width: 15, height: 15 }} /> {t.hero.cta}
            </a>
          </nav>

          {/* Hero */}
          <section className="v2-hero">
            <div>
              <span className="v2-eyebrow v2-rise"><span style={{ width: 7, height: 7, borderRadius: 99, background: acc, boxShadow: `0 0 10px ${acc}` }} /> {t.testimonialsBlock.titleA}{t.testimonialsBlock.titleHighlight}{t.testimonialsBlock.titleB}</span>
              <h1 className="v2-h1 v2-rise v2-d1" style={{ marginTop: 20 }}>
                {t.hero.titleA}<span className="v2-grad">{t.hero.titleHighlight}</span>
              </h1>
              <p className="v2-sub v2-rise v2-d2">{t.hero.subtitle}. {t.meta.description}</p>
              <div className="v2-rise v2-d3" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30, alignItems: "center" }}>
                <a href={ctaHref} className="v2-cta">{t.hero.cta} <ArrowRight style={{ width: 18, height: 18 }} /></a>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 13.5 }}>
                  <ShieldCheck style={{ width: 16, height: 16, color: acc }} /> {t.faq.items[3]?.q ?? "100% seguro"}
                </span>
              </div>
              <div className="v2-badges v2-rise v2-d4">
                {t.hero.badges.map((b, i) => (
                  <span key={i} className="v2-badge"><Check style={{ width: 13, height: 13, color: acc }} /> {b}</span>
                ))}
              </div>
            </div>

            {/* Signature: earnings card */}
            <div className="v2-earn v2-rise v2-d2">
              <div className="v2-earn-inner">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                    <Wallet style={{ width: 15, height: 15, color: acc }} /> {t.popular.upTo}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: acc, animation: "v2pulse 2.2s infinite" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: acc }} /> LIVE
                  </span>
                </div>
                <div className="v2-bal">{money(topAmount)}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{t.popular.perHour}</div>
                <div className="v2-prog"><span /></div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: "var(--subtle)" }}>{t.features[3]?.title}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: acc, fontWeight: 600 }}><Zap style={{ width: 13, height: 13 }} /> {"< 24h"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 16 }}>
                  {["PayPal", "Krypto", "Bank"].map((p) => (
                    <div key={p} style={{ textAlign: "center", padding: "9px 4px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>{p}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Trust strip */}
        <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.015)" }}>
          <div className="v2-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "center", padding: "18px 22px", color: "var(--subtle)", fontSize: 13, fontWeight: 500 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><BadgeCheck style={{ width: 15, height: 15, color: acc }} /> {t.footer.reviews.replace("· ", "")}</span>
            <span style={{ opacity: .4 }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Lock style={{ width: 14, height: 14 }} /> {t.footer.ssl}</span>
            <span style={{ opacity: .4 }}>•</span>
            <span>{t.footer.payments}</span>
          </div>
        </div>

        {/* Offers */}
        {offers.length > 0 && (
          <section className="v2-sec"><div className="v2-wrap">
            <span className="v2-eyebrow">{t.popular.eyebrow}</span>
            <h2 className="v2-h2" style={{ marginTop: 14 }}>{t.popular.titleA}<span className="v2-accent">{t.popular.titleHighlight}</span></h2>
            <div className="v2-offers">
              {offers.map((o) => (
                <a key={o.id} href={ctaHref} className="v2-card v2-offer">
                  {o.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.imageUrl} alt={o.name} className="v2-offer-img" />
                  ) : (
                    <div style={{ margin: "4px auto 12px", width: 62, height: 62 }}><GameTile name={o.name} size={62} /></div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{o.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--subtle)", marginBottom: 8 }}>{t.popular.upTo}</div>
                  <div className="v2-amt">{money(o.amount)}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 8 }}>
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} style={{ width: 12, height: 12, fill: "#fbbf24", color: "#fbbf24" }} />)}
                  </div>
                </a>
              ))}
            </div>
          </div></section>
        )}

        {/* How it works */}
        <section className="v2-sec"><div className="v2-wrap">
          <h2 className="v2-h2">{locale === "sv" ? "Så funkar det" : locale === "fr" ? "Comment ça marche" : "How it works"}</h2>
          <p className="v2-lead">{t.hero.subtitle}.</p>
          <div className="v2-steps">
            {t.features.map((f, i) => (
              <div key={i} className="v2-card v2-step">
                <div className="v2-num">{i + 1}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>{f.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div></section>

        {/* Stats band */}
        <section className="v2-sec" style={{ paddingTop: 0 }}><div className="v2-wrap">
          <div className="v2-stats">
            <div className="v2-stat"><b className="v2-accent">1.4M+</b><span style={{ color: "var(--muted)", fontSize: 14 }}>{locale === "sv" ? "spelare" : locale === "fr" ? "joueurs" : "players"}</span></div>
            <div className="v2-stat"><b>251k+</b><span style={{ color: "var(--muted)", fontSize: 14 }}>{locale === "sv" ? "recensioner" : locale === "fr" ? "avis" : "reviews"}</span></div>
            <div className="v2-stat"><b style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><TrendingUp style={{ width: 26, height: 26, color: acc }} /> {"< 24h"}</b><span style={{ color: "var(--muted)", fontSize: 14 }}>{t.features[3]?.title}</span></div>
          </div>
        </div></section>

        {/* Testimonials */}
        <section className="v2-sec" style={{ paddingTop: 0 }}><div className="v2-wrap">
          <span className="v2-eyebrow">{t.testimonialsBlock.eyebrow}</span>
          <h2 className="v2-h2" style={{ marginTop: 14 }}>{t.testimonialsBlock.titleA}<span className="v2-accent">{t.testimonialsBlock.titleHighlight}</span>{t.testimonialsBlock.titleB}</h2>
          <div className="v2-tst">
            {t.testimonialsBlock.items.map((tm, i) => (
              <div key={i} className="v2-card v2-tcard">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: DISPLAY, color: acc, background: `color-mix(in oklch, ${acc} 18%, transparent)`, border: `1px solid color-mix(in oklch, ${acc} 30%, transparent)` }}>{tm.name.charAt(0)}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600 }}>{tm.name} <BadgeCheck style={{ width: 14, height: 14, color: acc }} /></div>
                      <div style={{ fontSize: 12, color: "var(--subtle)" }}>{tm.city}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, color: acc, fontSize: 15 }}>{tm.amount}</span>
                </div>
                <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 5 }).map((_, j) => <Star key={j} style={{ width: 13, height: 13, fill: "#fbbf24", color: "#fbbf24" }} />)}</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>{tm.text}</p>
                <span style={{ fontSize: 11.5, color: "var(--subtle)" }}>{tm.time}</span>
              </div>
            ))}
          </div>
        </div></section>

        {/* FAQ */}
        <section className="v2-sec" style={{ paddingTop: 0 }}><div className="v2-wrap" style={{ maxWidth: 780 }}>
          <span className="v2-eyebrow">{t.faq.eyebrow}</span>
          <h2 className="v2-h2" style={{ marginTop: 14, marginBottom: 26 }}>{t.faq.title}</h2>
          <div className="v2-faq">
            {t.faq.items.map((it, i) => (
              <details key={i} open={i === 0}>
                <summary>{it.q}</summary>
                <p>{it.a}</p>
              </details>
            ))}
          </div>
        </div></section>

        {/* Final CTA */}
        <section className="v2-sec" style={{ paddingTop: 0 }}><div className="v2-wrap">
          <div className="v2-final">
            <h2 className="v2-h2" style={{ fontSize: "clamp(26px,4vw,40px)" }}>{t.sticky.title}</h2>
            <p className="v2-lead" style={{ margin: "12px auto 24px" }}>{t.sticky.sub}</p>
            <a href={ctaHref} className="v2-cta">{t.hero.cta} <ArrowRight style={{ width: 18, height: 18 }} /></a>
          </div>
        </div></section>

        {/* Footer */}
        <footer className="v2-foot"><div className="v2-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div className="v2-chips">
            <span className="v2-chip"><ShieldCheck style={{ width: 13, height: 13, color: acc }} /> {t.footer.support}</span>
            <span className="v2-chip">{t.footer.devices}</span>
            <span className="v2-chip"><Lock style={{ width: 12, height: 12 }} /> {t.footer.ssl}</span>
          </div>
          <span>{t.footer.legal} · {campaign.name}</span>
        </div></footer>

        {/* Sticky mobile CTA */}
        <a href={ctaHref} className="v2-sticky">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15 }}>{t.sticky.title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.sticky.sub}</div>
          </div>
          <span className="v2-cta" style={{ padding: "11px 18px", fontSize: 14 }}>{t.sticky.badge} <ArrowRight style={{ width: 16, height: 16 }} /></span>
        </a>
      </div>
    </>
  );
}
