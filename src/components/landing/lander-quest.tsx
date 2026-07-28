"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ArrowRight, ArrowLeft, Target, Wallet, Zap, Download, Apple, Smartphone, ShieldCheck } from "lucide-react";
import { resolveLocale, type LanderLocale } from "@/lib/lander-i18n";
import { getQuestDict, payMethods } from "@/lib/quest-i18n";
import { googleFontsHref } from "@/lib/fonts";
import { formatMoneyFromUsd } from "@/lib/currencies";
import type { LanderCampaign } from "@/components/landing/lander";

/* ────────────────────────────────────────────────────────────────────────────
   Quest — plantilla GPTP por etapas.

   Eje visual deliberadamente distinto de las v2 (que son near-black + acento
   neón + Space Grotesk): base cromática indigo, oro para la recompensa
   (en la UI de juegos el premio ES oro) y Chakra Petch como display.

   Signature: el rail de misión. Los pasos son etapas de quest, con nodos que
   se completan — el orden acá SÍ carga información (es una secuencia real).

   Estructura (toda la persuasión ocurre ANTES del click de salida):
     1. Elegí el juego      → micro-compromiso, con los montos reales
     2. Cómo te pagan       → objetivo, recompensa, método local, plazo
     3. Descargá            → salida, con detección real de tienda

   Datos reales / conectables:
     - montos: campaign.offers[].amount → formatMoneyFromUsd (moneda local)
     - detección iOS/Android: real, del user-agent (ya funciona)
     - payouts24h: prop opcional; si no hay dato, el bloque NO se renderiza
     - offerEndsAt: prop opcional; sin fecha real NO hay contador
   ──────────────────────────────────────────────────────────────────────── */

const DISPLAY = "'Chakra Petch', system-ui, sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

function styles(acc: string) {
  return `
.q {
  --acc: ${acc};
  --void: #0B0821;
  --panel: #151034;
  --panel-2: #1D1747;
  --edge: rgba(167,142,255,0.16);
  --edge-2: rgba(167,142,255,0.3);
  --ink: #F3F0FF;
  --muted: #A79EC8;
  --dim: #6B6394;
  --gold: #FFC53D;
  position: relative; min-height: 100vh; display: flex; flex-direction: column;
  color: var(--ink); background: var(--void); font-family: ${BODY};
  overflow-x: hidden; -webkit-font-smoothing: antialiased;
}
.q * { box-sizing: border-box; }
.q h1, .q h2, .q h3, .q .num { font-family: ${DISPLAY}; letter-spacing: -0.01em; margin: 0; }
.q p { margin: 0; }
.q a { text-decoration: none; color: inherit; }
/* Ojo: el reset NO toca background — .q button (0,1,1) le ganaría a .q-cta (0,1,0)
   y el CTA quedaría sin relleno. Los botones sin fondo lo declaran ellos mismos. */
.q button { font: inherit; color: inherit; border: none; cursor: pointer; }

/* Fondo: campo cromático + malla diagonal (no glow radial como v2) */
.q::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(120% 80% at 50% -20%, #2A1F63 0%, transparent 60%),
    radial-gradient(90% 70% at 100% 100%, color-mix(in oklch, var(--acc) 14%, transparent) 0%, transparent 65%);
}
.q::after {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .5;
  background-image: repeating-linear-gradient(115deg, transparent 0 22px, rgba(167,142,255,0.05) 22px 23px);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 65%);
}
.q > * { position: relative; z-index: 1; }

.q-wrap { width: 100%; max-width: 560px; margin: 0 auto; padding: 0 18px; }

/* ── Header: marca + chip de recompensa (siempre visible) ── */
.q-top { display: flex; align-items: center; gap: 10px; padding: 14px 0 10px; }
.q-brand { display: inline-flex; align-items: center; gap: 9px; min-width: 0; }
.q-brand-name { font-family: ${DISPLAY}; font-weight: 700; font-size: 17px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.q-loot {
  margin-left: auto; display: inline-flex; align-items: baseline; gap: 5px; flex-shrink: 0;
  padding: 6px 11px; border-radius: 9px;
  background: color-mix(in oklch, var(--gold) 12%, transparent);
  border: 1px solid color-mix(in oklch, var(--gold) 32%, transparent);
}
.q-loot-cap { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: color-mix(in oklch, var(--gold) 70%, white); }
.q-loot-amt { font-family: ${DISPLAY}; font-weight: 700; font-size: 16px; color: var(--gold); }

/* ── Signature: rail de misión ── */
.q-rail { position: relative; padding: 6px 0 2px; }
.q-track { position: absolute; top: 19px; height: 2px; background: var(--panel-2); border-radius: 2px; overflow: hidden; }
.q-track span { display: block; height: 100%; background: linear-gradient(90deg, color-mix(in oklch, var(--acc) 60%, var(--gold)), var(--acc)); transition: width .45s cubic-bezier(.2,.7,.2,1); }
.q-nodes { position: relative; display: flex; }
.q-nwrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; }
.q-node {
  width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;
  font-family: ${DISPLAY}; font-weight: 700; font-size: 12px;
  background: var(--panel); border: 1px solid var(--edge); color: var(--dim);
  transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
}
.q-node.done { background: var(--acc); border-color: var(--acc); color: #0B0821; }
.q-node.now {
  background: var(--panel-2); border-color: var(--acc); color: var(--ink); transform: scale(1.14);
  box-shadow: 0 0 0 4px color-mix(in oklch, var(--acc) 16%, transparent);
}
.q-nlabel { font-size: 9.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; text-align: center; color: var(--dim); line-height: 1.25; }
.q-nwrap.on .q-nlabel { color: var(--muted); }

/* ── Contenido de etapa ── */
.q-main { flex: 1; padding: 20px 0 8px; animation: qIn .34s cubic-bezier(.2,.7,.2,1) both; }
@keyframes qIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.q-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-family: ${DISPLAY}; font-size: 11px; font-weight: 700; letter-spacing: .16em; color: var(--dim); }
.q-eyebrow b { color: var(--acc); }
.q-h1 { margin-top: 12px; font-size: clamp(29px, 8.5vw, 40px); font-weight: 700; line-height: 1.02; }
.q-h1 i { font-style: normal; color: var(--gold); }
.q-h2 { margin-top: 12px; font-size: clamp(23px, 6.6vw, 30px); font-weight: 700; }
.q-sub { margin-top: 11px; font-size: 14.5px; line-height: 1.5; color: var(--muted); }

/* Grid de juegos */
.q-games { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
.q-game {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 9px;
  padding: 15px 11px 13px; border-radius: 16px; text-align: center; width: 100%;
  background: var(--panel); border: 1px solid var(--edge);
  transition: border-color .18s ease, background .18s ease, transform .12s ease;
}
.q-game:active { transform: scale(.975); }
.q-game.sel { border-color: var(--acc); background: var(--panel-2); }
.q-game-name { font-size: 12.5px; font-weight: 600; line-height: 1.25; }
.q-game-amt { font-family: ${DISPLAY}; font-weight: 700; font-size: 15px; color: var(--gold); }
.q-tick {
  position: absolute; top: 8px; right: 8px; width: 19px; height: 19px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; background: var(--acc); color: #0B0821;
  animation: qPop .2s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes qPop { from { opacity: 0; transform: scale(.5); } to { opacity: 1; transform: none; } }
.q-skip { display: block; width: 100%; margin-top: 16px; text-align: center; font-size: 12.5px; font-weight: 500; color: var(--dim); background: none; text-decoration: underline; text-underline-offset: 3px; }

/* Filas de "cómo te pagan" */
.q-rows { display: flex; flex-direction: column; gap: 9px; margin-top: 20px; }
.q-row { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: var(--panel); border: 1px solid var(--edge); }
.q-ico { width: 34px; height: 34px; flex-shrink: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--panel-2); border: 1px solid var(--edge); color: var(--acc); }
.q-row-cap { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); }
.q-row-val { margin-top: 2px; font-size: 14px; font-weight: 600; line-height: 1.35; }
.q-row-val.gold { font-family: ${DISPLAY}; font-size: 20px; font-weight: 700; color: var(--gold); }
.q-pays { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
.q-pay { padding: 4px 9px; border-radius: 7px; font-size: 11px; font-weight: 600; color: var(--muted); background: var(--panel-2); border: 1px solid var(--edge); }

/* Prueba agregada (solo si hay dato real) */
.q-proof { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 14px; font-size: 12.5px; color: var(--muted); }
.q-proof b { font-family: ${DISPLAY}; font-size: 15px; color: var(--ink); }
.q-dot { width: 6px; height: 6px; border-radius: 99px; background: #3ddc84; box-shadow: 0 0 8px #3ddc84; }

/* Etapa de salida */
.q-store { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; padding: 12px; border-radius: 12px; font-size: 12.5px; font-weight: 600; color: var(--muted); background: var(--panel); border: 1px dashed var(--edge-2); }
.q-ends { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 12px; font-size: 12px; color: var(--muted); }
.q-ends b { font-family: ${DISPLAY}; font-size: 14px; color: var(--gold); }

/* ── CTA fijo en el arco del pulgar ── */
.q-foot { position: sticky; bottom: 0; z-index: 5; padding: 12px 0 16px; background: linear-gradient(to top, var(--void) 62%, transparent); }
.q-cta {
  display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%;
  font-family: ${DISPLAY}; font-weight: 700; font-size: 17px;
  padding: 16px 22px; border-radius: 14px; color: #0B0821;
  background: linear-gradient(180deg, var(--acc), color-mix(in oklch, var(--acc) 80%, black));
  box-shadow: 0 10px 30px -8px color-mix(in oklch, var(--acc) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.3);
  transition: transform .12s ease;
}
.q-cta:active { transform: scale(.985); }
.q-cta[disabled] { opacity: .38; box-shadow: none; }
.q-back { display: inline-flex; align-items: center; gap: 5px; margin-top: 11px; font-size: 12.5px; font-weight: 600; color: var(--dim); background: none; }
.q-legal { padding: 4px 0 22px; text-align: center; font-size: 10.5px; line-height: 1.5; color: var(--dim); }

@media (min-width: 600px) {
  .q-games { grid-template-columns: repeat(3, 1fr); }
  .q-foot { position: static; background: none; }
}
@media (prefers-reduced-motion: reduce) {
  .q-main, .q-tick { animation: none; }
  .q-node, .q-track span { transition: none; }
}
`;
}

/* Tile generado cuando el juego no tiene logo (trata el nombre como un icono de app). */
function Tile({ name, size }: { name: string; size: number }) {
  let h = 0;
  for (const c of name || "?") h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.4, color: "#fff",
      background: `linear-gradient(150deg, hsl(${h} 70% 58%), hsl(${(h + 50) % 360} 66% 40%))`,
      border: "1px solid rgba(255,255,255,.14)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.22)",
    }}>
      {(name.charAt(0) || "•").toUpperCase()}
    </div>
  );
}

/** Contador real: sólo se usa cuando llega una fecha de vencimiento verdadera. */
function EndsIn({ iso, label }: { iso: string; label: string }) {
  const [left, setLeft] = useState<number>(() => new Date(iso).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(iso).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [iso]);
  if (!(left > 0)) return null;
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="q-ends">
      <Zap style={{ width: 13, height: 13 }} />
      {label} <b>{h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}:${pad(s)}`}</b>
    </div>
  );
}

type StageKey = "pick" | "paid" | "go";

export function LanderQuest({
  campaign, localeOverride, brand, payouts24h = null, offerEndsAt = null,
}: {
  campaign: LanderCampaign;
  localeOverride?: LanderLocale;
  brand?: string;
  /** Pagos reales en las últimas 24 h. null/0 → el bloque no se renderiza. */
  payouts24h?: number | null;
  /** Vencimiento real de la oferta (ISO). null → no hay contador. */
  offerEndsAt?: string | null;
}) {
  const locale = localeOverride ?? resolveLocale(campaign.locale);
  const t = getQuestDict(locale);
  const acc = campaign.colorPrimary || "#7C5CFF";
  const label = brand ?? campaign.name;
  const fontsHref = googleFontsHref(["Chakra Petch", "Plus Jakarta Sans"]);

  const offers = useMemo(() => campaign.offers.slice(0, 6), [campaign.offers]);
  const money = (n: number) =>
    campaign.currencyCode ? formatMoneyFromUsd(n, campaign.currencyCode) : `${campaign.currencySymbol}${n}`;
  const topAmount = offers.length ? Math.max(...offers.map((o) => o.amount)) : 25;

  const ctaHref = campaign.slug
    ? `/api/click?s1=${encodeURIComponent(campaign.slug)}&to=${encodeURIComponent(campaign.ctaUrl)}`
    : campaign.ctaUrl;

  // Con 0 o 1 oferta no tiene sentido la etapa de elección.
  const hasPick = offers.length > 1;
  const stages: StageKey[] = hasPick ? ["pick", "paid", "go"] : ["paid", "go"];
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(hasPick ? null : offers.length ? 0 : null);
  const stage = stages[idx]!;

  // Detección real del dispositivo, para anunciar la tienda correcta.
  const [os, setOs] = useState<"ios" | "android" | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/i.test(ua)) setOs("ios");
    else if (/Android/i.test(ua)) setOs("android");
  }, []);

  const stageLabel = (k: StageKey) => (k === "pick" ? t.stages[0] : k === "paid" ? t.stages[1] : t.stages[2]);
  const game = sel != null ? offers[sel] : undefined;
  const reward = game ? game.amount : topAmount;
  const fill = stages.length > 1 ? (idx / (stages.length - 1)) * 100 : 100;
  const edge = 50 / stages.length;

  function pick(i: number) {
    setSel(i);
    // Auto-avance: menos taps para tráfico impaciente, pero con tiempo de ver la selección.
    window.setTimeout(() => setIdx((v) => Math.min(v + 1, stages.length - 1)), 260);
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={fontsHref} />
      <style dangerouslySetInnerHTML={{ __html: styles(acc) }} />

      <div className="q">
        <div className="q-wrap">
          {/* Marca + recompensa siempre visible */}
          <header className="q-top">
            <span className="q-brand">
              {campaign.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.logoUrl} alt={label} style={{ height: 30, width: "auto", maxWidth: 104, objectFit: "contain", borderRadius: 8 }} />
              ) : (
                <Tile name={label} size={28} />
              )}
              <span className="q-brand-name">{label}</span>
            </span>
            <span className="q-loot">
              <span className="q-loot-cap">{t.upTo}</span>
              <span className="q-loot-amt">{money(topAmount)}</span>
            </span>
          </header>

          {/* Signature: rail de misión */}
          <div className="q-rail">
            <div className="q-track" style={{ left: `${edge}%`, right: `${edge}%` }}>
              <span style={{ width: `${fill}%` }} />
            </div>
            <div className="q-nodes">
              {stages.map((k, i) => (
                <div key={k} className={`q-nwrap${i === idx ? " on" : ""}`}>
                  <span className={`q-node ${i < idx ? "done" : i === idx ? "now" : ""}`}>
                    {i < idx ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
                  </span>
                  <span className="q-nlabel">{stageLabel(k)}</span>
                </div>
              ))}
            </div>
          </div>

          <main className="q-main" key={stage}>
            <span className="q-eyebrow">
              {t.mission} <b>{String(idx + 1).padStart(2, "0")}</b> {t.of} {String(stages.length).padStart(2, "0")}
            </span>

            {/* ── Etapa 1: elegir juego (el fold) ── */}
            {stage === "pick" && (
              <>
                <h1 className="q-h1">{t.h1a}<i>{t.h1b}</i></h1>
                <p className="q-sub">{t.sub}</p>
                <p className="q-row-cap" style={{ marginTop: 20 }}>{t.pick.sub}</p>
                <div className="q-games" style={{ marginTop: 9 }}>
                  {offers.map((o, i) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pick(i)}
                      aria-pressed={sel === i}
                      aria-label={sel === i ? `${o.name} — ${t.pick.selected}` : o.name}
                      className={`q-game${sel === i ? " sel" : ""}`}
                    >
                      {sel === i && <span className="q-tick"><Check style={{ width: 12, height: 12 }} /></span>}
                      {o.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.imageUrl} alt={o.name} style={{ width: 54, height: 54, borderRadius: 15, objectFit: "cover", border: "1px solid var(--edge)" }} />
                      ) : (
                        <Tile name={o.name} size={54} />
                      )}
                      <span className="q-game-name">{o.name}</span>
                      <span className="q-game-amt">{money(o.amount)}</span>
                    </button>
                  ))}
                </div>
                {/* Salida directa para el impaciente */}
                <button type="button" className="q-skip" onClick={() => setIdx(stages.length - 1)}>
                  {t.pick.skip}
                </button>
              </>
            )}

            {/* ── Etapa 2: cómo te pagan (la promesa, antes del click) ── */}
            {stage === "paid" && (
              <>
                <h2 className="q-h2">{t.paid.title}</h2>
                <p className="q-sub">{t.paid.sub}</p>
                <div className="q-rows">
                  <div className="q-row">
                    <span className="q-ico"><Target style={{ width: 17, height: 17 }} /></span>
                    <span>
                      <span className="q-row-cap">{t.paid.goalLabel}</span>
                      <p className="q-row-val">{game ? `${t.paid.goalValue} · ${game.name}` : t.paid.goalValue}</p>
                    </span>
                  </div>
                  <div className="q-row">
                    <span className="q-ico"><Wallet style={{ width: 17, height: 17 }} /></span>
                    <span>
                      <span className="q-row-cap">{t.paid.rewardLabel}</span>
                      <p className="q-row-val gold">{money(reward)}</p>
                    </span>
                  </div>
                  <div className="q-row">
                    <span className="q-ico"><ShieldCheck style={{ width: 17, height: 17 }} /></span>
                    <span style={{ minWidth: 0 }}>
                      <span className="q-row-cap">{t.paid.payLabel}</span>
                      <span className="q-pays">
                        {payMethods(locale).map((p) => <span key={p} className="q-pay">{p}</span>)}
                      </span>
                    </span>
                  </div>
                  <div className="q-row">
                    <span className="q-ico"><Zap style={{ width: 17, height: 17 }} /></span>
                    <span>
                      <span className="q-row-cap">{t.paid.speedLabel}</span>
                      <p className="q-row-val">{t.paid.speedValue}</p>
                    </span>
                  </div>
                </div>

                {/* Prueba social agregada — sólo con dato real */}
                {payouts24h != null && payouts24h > 0 && (
                  <div className="q-proof">
                    <span className="q-dot" />
                    <b>{new Intl.NumberFormat(locale).format(payouts24h)}</b> {t.payouts24h}
                  </div>
                )}
              </>
            )}

            {/* ── Etapa 3: salida ── */}
            {stage === "go" && (
              <>
                <h2 className="q-h2">{t.go.title}</h2>
                <p className="q-sub">{t.go.sub}</p>
                {game && (
                  <div className="q-row" style={{ marginTop: 20 }}>
                    {game.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={game.imageUrl} alt={game.name} style={{ width: 46, height: 46, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <Tile name={game.name} size={46} />
                    )}
                    <span>
                      <p className="q-row-val">{game.name}</p>
                      <span className="q-row-cap">{t.upTo} {money(game.amount)}</span>
                    </span>
                  </div>
                )}
                {/* Detección real del dispositivo: anticipa a dónde lo lleva el tap */}
                <div className="q-store">
                  {os === "ios" ? <Apple style={{ width: 15, height: 15 }} /> : os === "android" ? <Smartphone style={{ width: 15, height: 15 }} /> : <Download style={{ width: 15, height: 15 }} />}
                  {os === "ios" ? t.go.opensIos : os === "android" ? t.go.opensAndroid : t.go.opensStore}
                </div>
                {offerEndsAt && <EndsIn iso={offerEndsAt} label={t.endsIn} />}
              </>
            )}
          </main>
        </div>

        {/* CTA en el arco del pulgar */}
        <div className="q-foot">
          <div className="q-wrap">
            {stage === "go" ? (
              <a href={ctaHref} data-cta className="q-cta">
                {t.go.cta} <ArrowRight style={{ width: 19, height: 19 }} />
              </a>
            ) : (
              <button
                type="button"
                className="q-cta"
                disabled={stage === "pick" && sel == null}
                onClick={() => setIdx((v) => Math.min(v + 1, stages.length - 1))}
              >
                {t.next} <ArrowRight style={{ width: 19, height: 19 }} />
              </button>
            )}
            {idx > 0 && (
              <button type="button" className="q-back" onClick={() => setIdx((v) => Math.max(v - 1, 0))}>
                <ArrowLeft style={{ width: 14, height: 14 }} /> {t.back}
              </button>
            )}
          </div>
        </div>

        <div className="q-wrap"><p className="q-legal">{label}</p></div>
      </div>
    </>
  );
}
