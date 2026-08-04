"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveLocale, type LanderLocale } from "@/lib/lander-i18n";
import { getStoreDict } from "@/lib/store-i18n";
import { getAgeCopy } from "@/lib/age-gate-i18n";
import { payMethods } from "@/lib/quest-i18n";
import { googleFontsHref, fontStack } from "@/lib/fonts";
import { brandFromOffer } from "@/lib/landing-templates";
import { formatMoneyFromUsd, getCurrencyByCode } from "@/lib/currencies";
import type { LanderCampaign } from "@/components/landing/lander";

/* ────────────────────────────────────────────────────────────────────────────
   Store — ficha de app con CTA de tienda.

   Eje visual: no es una landing "de sitio" como las v2 ni un embudo por etapas
   como Quest. Imita la ficha de una app en el teléfono: columna única de 430 px,
   tarjetas apiladas, gris neutro casi negro (#141414) con el acento de la
   campaña, y la barra de descarga clavada abajo. Todo entra en un pulgar.

   Signature: el ticker de pagos de la barra superior + la barra fija con los
   dos botones de tienda (App Store / Google Play).

   El click de salida NO es directo: los botones de tienda abren un modal con
   el tip de registro ("elegí 21+") y recién ahí está el link que sale. Toda la
   fricción útil ocurre antes de perder al visitante.

   Datos reales / conectables:
     - juego destacado: la oferta con mayor payout; el resto va en la lista
     - montos: campaign.offers[].amount → formatMoneyFromUsd (moneda local)
     - métodos de cobro del paso 3: payMethods() por país de la campaña
     - detección iOS/Android: real, del user-agent (define el botón primario)
     - ticker: nombres del diccionario + montos derivados de payouts reales
   ──────────────────────────────────────────────────────────────────────── */

/** Referencia del claim "pagado en total" (USD). Se muestra en moneda local. */
const PAID_OUT_USD = 50_000_000;
/** Rating de tienda mostrado en el hero y en la franja de confianza. */
const APP_RATING = 4.7;
/** Base del contador "gente ganando ahora" (SSR determinista; camina al montar). */
const LIVE_BASE = 1845;

function styles(acc: string, fTitle: string, fBody: string) {
  return `
.st {
  --acc: ${acc};
  --bg: #141414;
  --ink: #F4F4F6;
  --muted: #9C9CA6;
  --dim: #6B6B76;
  --line: rgba(255,255,255,0.06);
  --line-2: rgba(255,255,255,0.12);
  --pos: color-mix(in oklch, var(--acc) 72%, white);
  position: relative; min-height: 100svh; background: #08080A; color: var(--ink);
  font-family: ${fBody}; -webkit-font-smoothing: antialiased; overflow-x: hidden;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
}
.st * { box-sizing: border-box; }
.st h1, .st h2, .st h3, .st .st-display { font-family: ${fTitle}; margin: 0; }
.st p { margin: 0; }
.st a { text-decoration: none; color: inherit; }
.st button { font: inherit; color: inherit; border: none; cursor: pointer; background: none; }

.st-page {
  max-width: 430px; margin: 0 auto; padding-bottom: 132px; position: relative;
  background: radial-gradient(560px 320px at 50% -40px, color-mix(in oklch, var(--acc) 15%, transparent), transparent 70%), var(--bg);
}

/* ── Signature 1: ticker de pagos ── */
.st-notif {
  position: relative; height: 42px; display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding: 0 16px; text-align: center;
  background: #1A1A1A; border-bottom: 1px solid var(--line);
  color: #D7D7DE; font-size: 12.5px; font-weight: 500; letter-spacing: .01em;
}
.st-notif-in { position: absolute; width: 100%; padding: 0 16px; transition: opacity .34s ease, transform .34s ease; animation: stNotifIn .34s ease both; }
.st-notif-in.out { opacity: 0; transform: translateY(-10px); animation: none; }
@keyframes stNotifIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.st-notif b { color: #fff; font-weight: 600; }
.st-notif-amt { color: var(--pos); font-weight: 700; }
.st-notif-flag { font-size: 12px; margin-right: 5px; opacity: .75; }

/* ── Tarjetas ── */
.st-card {
  margin: 14px 16px; padding: 26px 22px; border-radius: 20px;
  background: linear-gradient(180deg, #1C1C1C 0%, #161616 100%); border: 1px solid var(--line);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 28px rgba(0,0,0,0.35);
}

/* ── Hero ── */
.st-hero { position: relative; overflow: hidden; padding: 32px 22px 26px; text-align: center; }
.st-hero-glow {
  position: absolute; top: -90px; left: 50%; transform: translateX(-50%); width: 320px; height: 240px;
  pointer-events: none; filter: blur(4px);
  background: radial-gradient(circle, color-mix(in oklch, var(--acc) 34%, transparent) 0%, transparent 70%);
}
.st-logo { position: relative; z-index: 1; display: flex; justify-content: center; margin-bottom: 18px; }
.st-logo::before {
  content: ""; position: absolute; top: 50%; left: 50%; width: 180px; height: 180px; transform: translate(-50%,-50%);
  background: radial-gradient(circle, color-mix(in oklch, var(--acc) 24%, transparent) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.st-logo img, .st-logo > span { position: relative; z-index: 1; }
.st-rating {
  position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px;
  padding: 5px 13px; border-radius: 99px; font-size: 12.5px; font-weight: 600;
  color: color-mix(in oklch, var(--acc) 62%, white);
  background: color-mix(in oklch, var(--acc) 9%, transparent);
  border: 1px solid color-mix(in oklch, var(--acc) 28%, transparent);
}
.st-stars { color: var(--acc); letter-spacing: -1px; }
.st-rating .sep { opacity: .4; }
.st-rating .rev { font-weight: 400; color: var(--muted); }
.st-h1 { position: relative; z-index: 1; font-size: 30px; font-weight: 800; line-height: 1.18; letter-spacing: -0.03em; margin-bottom: 12px; color: #fff; }
.st-h1 i { font-style: normal; color: var(--acc); }
.st-sub { position: relative; z-index: 1; max-width: 290px; margin: 0 auto 20px; font-size: 14.5px; line-height: 1.6; color: var(--muted); }
.st-live {
  position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 600;
  color: color-mix(in oklch, var(--acc) 55%, white);
  background: color-mix(in oklch, var(--acc) 8%, transparent);
  border: 1px solid color-mix(in oklch, var(--acc) 25%, transparent);
}
.st-dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: 50%; background: var(--acc); animation: stPulse 2s infinite; }
@keyframes stPulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--acc) 40%, transparent); } 50% { box-shadow: 0 0 0 5px color-mix(in oklch, var(--acc) 0%, transparent); } }

/* ── Ficha del juego + pasos ── */
.st-game-card { padding: 20px 20px 24px; }
.st-game { display: flex; align-items: center; gap: 14px; }
.st-game-img {
  width: 76px; height: 76px; flex-shrink: 0; border-radius: 18px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(155deg, #232323, #161616); border: 1px solid rgba(255,255,255,0.07);
  box-shadow: 0 6px 16px rgba(0,0,0,0.3);
}
.st-game-img img { width: 100%; height: 100%; object-fit: cover; }
.st-game-info { flex: 1; min-width: 0; }
.st-game-title { font-size: 16.5px; font-weight: 700; color: #fff; letter-spacing: -0.01em; margin-bottom: 4px; }
.st-game-meta { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.st-game-pay { font-size: 14px; font-weight: 700; color: var(--pos); letter-spacing: -0.01em; }

.st-more { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.st-more-row { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 13px; background: rgba(255,255,255,0.03); border: 1px solid var(--line); }
.st-more-img { width: 36px; height: 36px; flex-shrink: 0; border-radius: 11px; overflow: hidden; }
.st-more-img img { width: 100%; height: 100%; object-fit: cover; }
.st-more-name { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-more-amt { font-size: 13.5px; font-weight: 700; color: var(--pos); flex-shrink: 0; }

.st-hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 22px 0 20px; }
.st-steps-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); margin-bottom: 16px; }
.st-steps { list-style: none; display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; }
.st-step { display: flex; align-items: center; gap: 13px; }
.st-step-n {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: var(--acc);
  background: color-mix(in oklch, var(--acc) 10%, transparent);
  border: 1px solid color-mix(in oklch, var(--acc) 25%, transparent);
}
.st-step-t { font-size: 14.5px; font-weight: 500; color: #D7D7DE; }

/* ── Franja de confianza ── */
.st-trust { display: flex; align-items: stretch; justify-content: space-between; margin: 14px 16px; padding: 18px 12px; border-radius: 16px; background: #131318; border: 1px solid var(--line); }
.st-trust-i { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.st-trust-n { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.st-trust-d { font-size: 10.5px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: .02em; color: var(--dim); }
.st-trust-sep { width: 1px; margin: 2px 0; background: rgba(255,255,255,0.08); }

.st-disc { padding: 6px 26px 16px; font-size: 11.5px; line-height: 1.65; text-align: center; color: var(--dim); }
.st-legal { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0 24px 28px; }
.st-legal a { font-size: 11.5px; font-weight: 600; color: var(--dim); letter-spacing: .01em; }
.st-legal a:active { color: var(--muted); }
.st-legal-sep { width: 3px; height: 3px; flex-shrink: 0; border-radius: 50%; background: #3A3A42; }

/* ── Signature 2: barra de descarga fija ── */
.st-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 100;
  width: 100%; max-width: 430px; padding: 14px 16px 22px;
  background: rgba(13,13,17,0.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255,255,255,0.08); box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
}
.st-bar-eyebrow { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 10px; font-size: 11.5px; font-weight: 600; color: var(--muted); }
.st-bar-eyebrow span { width: 5px; height: 5px; flex-shrink: 0; border-radius: 50%; background: var(--acc); }
.st-btns { display: flex; gap: 10px; }
.st-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px;
  padding: 13px 10px; border-radius: 14px; font-size: 13px; font-weight: 700; letter-spacing: -0.01em;
  transition: opacity .15s, transform .1s;
}
.st-btn:active { opacity: .88; transform: scale(0.97); }
.st-btn svg { flex-shrink: 0; }
.st-btn-off { background: linear-gradient(180deg, #1E1E24, #131318); border: 1px solid var(--line-2); color: #fff; }
.st-btn-on {
  color: #050505; border: 1px solid transparent;
  background: linear-gradient(180deg, var(--acc), color-mix(in oklch, var(--acc) 82%, black));
  box-shadow: 0 6px 18px color-mix(in oklch, var(--acc) 35%, transparent);
}
.st-btn-lbl { display: flex; flex-direction: column; align-items: flex-start; }
.st-btn-sub { font-size: 9.5px; font-weight: 500; opacity: .78; line-height: 1; }
.st-btn-main { font-size: 13px; font-weight: 700; line-height: 1.3; }

/* ── Modal previo a la salida ── */
.st-overlay {
  position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center;
  padding: max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom));
  background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  animation: stFade .18s ease both;
}
@keyframes stFade { from { opacity: 0; } to { opacity: 1; } }
.st-modal {
  position: relative; width: 100%; max-width: min(360px, calc(100vw - 40px));
  padding: 28px 22px 22px; border-radius: 22px; text-align: center;
  background: #0b0e11; border: 1px solid var(--line); box-shadow: 0 24px 80px rgba(0,0,0,0.65);
  animation: stPop .22s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes stPop { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }
.st-modal-kicker { margin-bottom: 14px; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: color-mix(in oklch, var(--acc) 82%, black 8%); }
.st-modal-title { margin-bottom: 12px; font-size: clamp(20px, 5.2vw, 24px); font-weight: 800; line-height: 1.28; letter-spacing: -0.02em; color: #fff; }
.st-modal-title i { font-style: normal; color: var(--acc); }
.st-modal-desc { margin-bottom: 22px; font-size: 14px; line-height: 1.5; color: #888; }
.st-modal-go {
  display: block; width: 100%; padding: 16px 22px; border-radius: 999px;
  font-size: 16px; font-weight: 800; color: #050505;
  background: linear-gradient(135deg, var(--acc), color-mix(in oklch, var(--acc) 82%, black));
  box-shadow: 0 8px 28px color-mix(in oklch, var(--acc) 35%, transparent);
}
.st-modal-go:active { transform: scale(.98); }
.st-modal-alt { display: block; width: 100%; margin-top: 14px; font-size: 12.5px; font-weight: 600; color: var(--dim); text-decoration: underline; text-underline-offset: 3px; }
.st-modal-x {
  position: absolute; top: 12px; right: 14px; width: 32px; height: 32px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(255,255,255,0.08); color: #888; font-size: 20px; line-height: 1;
}

@media (min-width: 431px) { .st-page { padding-top: 12px; padding-bottom: 150px; box-shadow: 0 0 60px rgba(0,0,0,0.6); } }
@media (prefers-reduced-motion: reduce) {
  .st-dot, .st-notif-in, .st-overlay, .st-modal { animation: none; }
  .st-notif-in { transition: none; }
}
`;
}

/** Tile generado cuando la oferta (o la marca) no trae logo. */
function Tile({ name, size }: { name: string; size: number }) {
  let h = 0;
  for (const c of name || "?") h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span style={{
      width: size, height: size, borderRadius: size * 0.24, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4, color: "#fff",
      background: `linear-gradient(150deg, hsl(${h} 70% 58%), hsl(${(h + 50) % 360} 66% 40%))`,
      border: "1px solid rgba(255,255,255,.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.22)",
    }}>
      {(name.charAt(0) || "•").toUpperCase()}
    </span>
  );
}

/* Marcas de tienda: van dibujadas porque son parte del lenguaje de "descargá
   la app" y lucide no trae la de Google Play. */
function AppleMark() {
  return (
    <svg width="18" height="20" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.7 0 663.2 0 541.8 0 347.4 103.7 248 205 248c66.5 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}
function PlayMark() {
  return (
    <svg width="18" height="20" viewBox="0 0 512 512" fill="currentColor" aria-hidden>
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.6-233L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c17.1-9.7 17.1-34.4-.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  );
}

/** Claim de "pagado en total" en la moneda de la campaña (ej. 50M USD → "530 mn kr"). */
function compactFromUsd(usd: number, code: string): string {
  const cur = getCurrencyByCode(code) ?? getCurrencyByCode("USD")!;
  const v = usd * cur.rate;
  try {
    return new Intl.NumberFormat(cur.locale, { style: "currency", currency: cur.code, notation: "compact", maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${cur.symbol}${Math.round(v / 1_000_000)}M`;
  }
}

export function LanderStore({
  campaign, localeOverride, brand,
}: {
  campaign: LanderCampaign;
  localeOverride?: LanderLocale;
  brand?: string;
}) {
  const locale = localeOverride ?? resolveLocale(campaign.locale);
  const t = getStoreDict(locale);
  const acc = campaign.colorPrimary || "#00ff88";
  // Igual que en Quest: al visitante le habla la marca de la OFERTA, no el
  // nombre interno de la campaña.
  const label = brand ?? brandFromOffer(campaign.offerName, campaign.name);
  const logo = campaign.offerImage ?? campaign.logoUrl;
  const fontsHref = googleFontsHref([campaign.fontTitle ?? "Inter", campaign.fontBody ?? "Inter"]);

  const track = (url: string) =>
    campaign.slug ? `/api/click?s1=${encodeURIComponent(campaign.slug)}&to=${encodeURIComponent(url)}` : url;
  const ctaHref = track(campaign.ctaUrl);

  // Ruta de menores: solo si la campaña pide edad Y definió una oferta distinta
  // (con la misma URL el link no decide nada y sobra).
  const under21Href =
    campaign.ctaAge && campaign.ctaUrlUnder && campaign.ctaUrlUnder !== campaign.ctaUrl
      ? track(campaign.ctaUrlUnder)
      : null;
  const age = getAgeCopy(locale);

  const money = (n: number) =>
    campaign.currencyCode ? formatMoneyFromUsd(n, campaign.currencyCode) : `${campaign.currencySymbol}${n}`;
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);

  // La ficha destacada es la oferta que más paga (es el gancho); el resto
  // conserva el orden que eligió el operador.
  const offers = campaign.offers;
  const featured = useMemo(
    () => offers.reduce<LanderCampaign["offers"][number] | undefined>((best, o) => (!best || o.amount > best.amount ? o : best), undefined),
    [offers],
  );
  const rest = offers.filter((o) => o.id !== featured?.id).slice(0, 3);

  // Ticker: nombres del diccionario, montos derivados de los payouts reales
  // (fracción determinista, para que SSR y cliente coincidan).
  const feed = useMemo(() => {
    const amounts = offers.length ? offers.map((o) => o.amount) : [12, 18, 24];
    return t.names.map((name, i) => ({
      name,
      amount: money(Math.max(1, (amounts[i % amounts.length] ?? 12) * (0.4 + ((i * 17) % 46) / 100))),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, t.names, campaign.currencyCode, campaign.currencySymbol]);

  const [idx, setIdx] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    let swap: number | undefined;
    const rotate = window.setInterval(() => {
      setOut(true);
      swap = window.setTimeout(() => {
        setIdx((v) => (v + 1) % feed.length);
        setOut(false);
      }, 340);
    }, 3200);
    return () => { window.clearInterval(rotate); if (swap) window.clearTimeout(swap); };
  }, [feed.length]);

  const [live, setLive] = useState(LIVE_BASE);
  useEffect(() => {
    const id = window.setInterval(() => {
      setLive((v) => {
        const next = v + Math.floor(Math.random() * 7) - 3;
        if (next < 1700) return 1700 + Math.floor(Math.random() * 50);
        if (next > 2000) return 2000 - Math.floor(Math.random() * 50);
        return next;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  // Detección real del dispositivo: define cuál de los dos botones es el primario.
  const [os, setOs] = useState<"ios" | "android" | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/i.test(ua)) setOs("ios");
    else if (/Android/i.test(ua)) setOs("android");
  }, []);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  /**
   * Esta plantilla usa SU PROPIO modal como filtro de edad, en vez del <AgeGate>
   * global (es el enfoque de la landing original: en lugar de preguntar la edad,
   * la sugiere como tip de registro).
   *
   * Cómo conviven sin tocar nada del sistema:
   *  - Los botones de tienda son `a[data-cta]` que cortan la navegación. El tap
   *    igual cuenta como ClickButton para el pixel (ese tracker ignora
   *    defaultPrevented a propósito) y el <AgeGate> global NO se abre, porque sí
   *    chequea defaultPrevented.
   *  - Los links de salida del modal NO llevan data-cta, así que el <AgeGate>
   *    tampoco se monta encima. Queda inerte aunque la campaña tenga ctaAge=ON.
   *  - El ruteo de menores no se pierde: si la campaña definió ctaUrlUnder,
   *    aparece dentro del modal (`under21Href`) con la misma copy localizada
   *    que usa el gate del sistema.
   */
  const openModal = (e: React.MouseEvent) => { e.preventDefault(); setOpen(true); };

  const item = feed[idx] ?? feed[0];
  const stars = "★★★★★";
  const iosPrimary = os === "ios";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={fontsHref} />
      <style dangerouslySetInnerHTML={{ __html: styles(acc, fontStack(campaign.fontTitle), fontStack(campaign.fontBody)) }} />

      <div className="st">
        <div className="st-page">
          {/* Signature: ticker de pagos */}
          <div className="st-notif" aria-live="off">
            {item && (
              <div key={idx} className={`st-notif-in${out ? " out" : ""}`}>
                <span className="st-notif-flag">{t.flag}</span>
                <b>{item.name}</b> {t.notif.earned} <span className="st-notif-amt">{item.amount}</span> — {t.notif.instant}
              </div>
            )}
          </div>

          {/* Hero */}
          <div className="st-card st-hero">
            <div className="st-hero-glow" />
            <div className="st-logo">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={label} style={{ width: 92, height: 92, objectFit: "contain", borderRadius: 20 }} />
              ) : (
                <Tile name={label} size={92} />
              )}
            </div>
            <div>
              <span className="st-rating">
                <span className="st-stars">{stars}</span>
                <span>{num(APP_RATING)}</span>
                <span className="sep">·</span>
                <span>{t.hero.store}</span>
                <span className="rev">({t.hero.reviews})</span>
              </span>
            </div>
            <h1 className="st-h1">{t.hero.h1a}<br /><i>{t.hero.h1b}</i></h1>
            <p className="st-sub">{t.hero.sub}</p>
            <div>
              <span className="st-live">
                <span className="st-dot" />
                {num(live)} {t.hero.live}
              </span>
            </div>
          </div>

          {/* Ficha del juego destacado + cómo funciona */}
          <div className="st-card st-game-card">
            {featured && (
              <>
                <div className="st-game">
                  <div className="st-game-img">
                    {featured.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featured.imageUrl} alt={featured.name} />
                    ) : (
                      <Tile name={featured.name} size={76} />
                    )}
                  </div>
                  <div className="st-game-info">
                    <div className="st-game-title">{featured.name}</div>
                    <div className="st-game-meta">
                      <span className="st-stars">{stars}</span> {num(featured.rating)} · {featured.badge || t.game.rated}
                    </div>
                    <div className="st-game-pay">
                      {t.game.pay} {money(featured.amount)}{featured.tag ? ` / ${featured.tag}` : ""}
                    </div>
                  </div>
                </div>

                {/* El resto del catálogo, compacto: la oferta no es un único juego */}
                {rest.length > 0 && (
                  <div className="st-more">
                    {rest.map((o) => (
                      <div key={o.id} className="st-more-row">
                        <span className="st-more-img">
                          {o.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={o.imageUrl} alt={o.name} />
                          ) : (
                            <Tile name={o.name} size={36} />
                          )}
                        </span>
                        <span className="st-more-name">{o.name}</span>
                        <span className="st-more-amt">{money(o.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="st-hr" />
              </>
            )}

            <div className="st-steps-label">{t.steps.label}</div>
            <ol className="st-steps">
              {[
                t.steps.one.replace("{brand}", label),
                t.steps.two,
                `${t.steps.three} ${payMethods(campaign.locale, locale).join(", ")}`,
              ].map((s, i) => (
                <li key={i} className="st-step">
                  <span className="st-step-n">{i + 1}</span>
                  <span className="st-step-t">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Franja de confianza */}
          <div className="st-trust">
            <div className="st-trust-i">
              <span className="st-trust-n st-display">{compactFromUsd(PAID_OUT_USD, campaign.currencyCode)}</span>
              <span className="st-trust-d">{t.trust.paid}</span>
            </div>
            <div className="st-trust-sep" />
            <div className="st-trust-i">
              <span className="st-trust-n st-display">{num(APP_RATING)}★</span>
              <span className="st-trust-d">{t.trust.rating}</span>
            </div>
            <div className="st-trust-sep" />
            <div className="st-trust-i">
              <span className="st-trust-n st-display">{money(0)}</span>
              <span className="st-trust-d">{t.trust.join}</span>
            </div>
          </div>

          <p className="st-disc">{t.disclaimer}</p>

          <div className="st-legal">
            <a href={ctaHref}>{t.legal.privacy}</a>
            <span className="st-legal-sep" />
            <a href={ctaHref}>{t.legal.terms}</a>
          </div>
        </div>

        {/* Signature: barra de descarga fija */}
        <div className="st-bar">
          <div className="st-bar-eyebrow"><span />{t.cta.eyebrow}</div>
          <div className="st-btns">
            <a href={ctaHref} data-cta onClick={openModal} className={`st-btn ${iosPrimary ? "st-btn-on" : "st-btn-off"}`}>
              <AppleMark />
              <span className="st-btn-lbl">
                <span className="st-btn-sub">{t.cta.iosSub}</span>
                <span className="st-btn-main">{t.cta.iosMain}</span>
              </span>
            </a>
            <a href={ctaHref} data-cta onClick={openModal} className={`st-btn ${iosPrimary ? "st-btn-off" : "st-btn-on"}`}>
              <PlayMark />
              <span className="st-btn-lbl">
                <span className="st-btn-sub">{t.cta.androidSub}</span>
                <span className="st-btn-main">{t.cta.androidMain}</span>
              </span>
            </a>
          </div>
        </div>

        {/* Paso intermedio antes de salir */}
        {open && (
          <div className="st-overlay" onClick={() => setOpen(false)}>
            <div className="st-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="st-modal-x" onClick={() => setOpen(false)} aria-label="✕">×</button>
              <p className="st-modal-kicker">{t.modal.kicker}</p>
              <h2 className="st-modal-title">{t.modal.titleA}<i>21+</i>{t.modal.titleB}</h2>
              <p className="st-modal-desc">{t.modal.desc.replace("{brand}", label)}</p>
              <a href={ctaHref} className="st-modal-go">{under21Href ? age.yes : t.modal.cta}</a>
              {under21Href && <a href={under21Href} className="st-modal-alt">{age.no}</a>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
