# TapSur — el sistema de punta a punta

Command center de marketing de afiliación para ofertas **get-paid-to-play** (GPTP)
promocionadas con TikTok Ads. Cubre el ciclo completo: crear la campaña, generar
la landing, comprar tráfico, rastrear el click, recibir la conversión y repartir
la plata.

> Documento generado leyendo el código, no de memoria. Última revisión sobre el
> commit `35de964`.

---

## 1. El flujo del negocio

Entender esto primero hace que el resto del sistema se explique solo.

```
  creativo en TikTok  →  landing propia  →  oferta del afiliado  →  postback
        (Spark)            (plantilla)         (TapRain)            (revenue)
                                │                                       │
                          /api/click                              /api/postback
                          registra Click                        registra Conversion
                                └───────── unidos por el `s1` = slug ────┘
```

- **`s1`** es la llave de todo: el *slug* de la campaña viaja como subid hasta la
  red de afiliados y vuelve en el postback. Es lo que permite atribuir revenue a
  una campaña sin depender de la red.
- **Click**: `/api/click?s1=…&to=…` registra y redirige (302). Deduplica por
  `ip + s1` dentro de 6 h, así una misma persona recargando no infla la métrica.
- **Conversión**: `/api/postback?price=…&s1=…` la crea TapRain. Acepta `price` o
  `payout`, valida que sea numérico y no negativo.

---

## 2. Stack y arquitectura

| Capa | Qué usa |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| API | tRPC v11 — **24 routers** |
| Datos | Prisma → Supabase Postgres (pooler) — **41 modelos** |
| Auth | NextAuth v4, sesión JWT |
| Estilos | Tailwind v4 + CSS vars propias (tema oscuro) |
| Storage | Supabase Storage (imágenes) · **S3 + CloudFront** (video) |
| IA | Gemini (`gemini-2.5-flash`) + pgvector para RAG |
| Deploy | VPS Debian, pm2 (`tapsur`, puerto 4010), nginx |

**Decisión transversal**: el deploy corre `npm run build` **sin `npm install`**.
Por eso el sistema evita dependencias nuevas y hay varias cosas escritas a mano
que normalmente serían un paquete: la firma SigV4 de S3, el tooltip, el i18n, el
reproductor de video y la carga de ffmpeg desde CDN.

### Permisos

Tres roles: **`admin`**, **`estrategista`**, **`user`**.

El alcance de datos se centraliza en `lib/scope.ts`:

- `getScope()` → admin ve todo (`slugs: null`); un usuario ve solo las campañas
  donde es `ownerId`.
- `convWhere(slugs)` / `campaignWhere(...)` aplican ese alcance a las consultas.

En tRPC: `publicProcedure` → `protectedProcedure` (logueado) → `adminProcedure`.

---

## 3. Campañas y landings

### La campaña

Una `Campaign` es la unidad central. Define a dónde va el tráfico y cómo se ve
la página. Campos que gobiernan comportamiento:

| Campo | Efecto |
|---|---|
| `slug` | el `s1`; único, se autodeduplica (`-2`, `-3`…) |
| `templateSlug` | qué plantilla renderiza |
| `locale` | idioma **y** país objetivo (moneda, rails de pago, bandera) |
| `ctaUrl` | destino real de la oferta |
| `ctaAge` + `ctaUrlUnder` | CTA con pregunta de edad (+21 / −21) |
| `gate` | muestra o no la intro con swipe-up |
| `cloak` + `whitepages` | ON: redirige a una whitepage de ropa |
| `geoGate` + `geoCountries` | solo deja entrar al país objetivo |
| `tiktokPixel` | ID público del pixel (vacío = sin pixel) |
| `domain` | se sirve en `dominio/slug` |

### Las 6 plantillas

`classic` · `freecash-v2` · `teststar-v2` · `testerup-v2` · `quest` · `store`

- Las **v2** comparten un componente y solo cambian de marca.
- **Quest** es un embudo por etapas (elegir juego → cómo te pagan → descargar),
  con una decisión deliberada: *toda la persuasión ocurre antes del click de
  salida*, porque ese click es la conversión y después el visitante ya no está.
- El selector vive en `lander-switch.tsx`; `landing-templates.ts` decide qué
  componente, qué marca y qué variante de intro usar.

### Internacionalización de las landings

`lander-i18n.ts` define **10 locales**: `sv, fr, en, de, nl, nl-BE, no, fi, pl, it`.

- `nl-BE` (Bélgica) se **deriva** de `nl` en vez de duplicarse: en texto escrito
  las variantes son casi idénticas, así que solo se sobrescribe lo que cambia
  (ciudades belgas, Bancontact como medio de pago).
- Los montos se convierten a la moneda local con `formatMoneyFromUsd`.
- Los rails de cobro se eligen **por país, no por idioma** — Dinamarca usa la
  copy en inglés pero cobra con MobilePay.

### Cadena de defensa antes de renderizar

Las dos rutas públicas (`/landing/[slug]` y `/landing` por dominio) aplican, en
orden:

1. Redirector de dominio/ruta (`resolveRedirect`)
2. `isActive` → 404 si está pausada
3. **Cloaker** → whitepage
4. **Geo gate** → whitepage si el país no está permitido

El geo gate **falla abierto** a propósito: si el lookup falla, tarda de más
(corte a 1,5 s) o el país es desconocido, el visitante **pasa**. Un corte del
servicio de geo fallando cerrado bloquearía todo el tráfico, que cuesta mucho
más que dejar entrar algunos clicks fuera de geo.

---

## 4. Módulos del panel

El sidebar está agrupado por función:

**Campañas** — lista, alta (formulario por pasos con preview en vivo de la
landing) y catálogo de ofertas de TapRain.

**Herramientas**
- **Tarjetas (VCC)** — tarjetas virtuales vía la Ads Suite de TapRain. Se
  autentica con **cookie de sesión**, no API key: se guarda en `AppConfig` para
  poder rotarla desde la UI cuando expira, sin redeploy.
- **Billetera / Finanzas** — balance, gasto y reparto (`RevenueSplit`).
- **Interacciones** — likes, comentarios y saves vía **DripFeed**
  (`dripfeedpanel.com/api/v2`). El admin fija qué servicio se usa y arma listas
  de comentarios; los usuarios solo eligen de lo que él dejó.

**Contenido**
- **Sparks** — catálogo de creativos de TikTok, WH y BH, con claim y rating.
- **Feed** — red social interna. Solo el admin publica; el resto comenta y da
  like. Es donde se publican los ángulos (diapositivas + descripción).
- **Proxies** — pool de IPs (IPRoyal) con claim por usuario.
- **Redirecciones** — cloaking por dominio/ruta.

**Análisis** — mapa de operaciones, estadísticas (con datos de TapRain y
fallback local) y leaderboard del equipo.

**Tutoriales** — videoteca con reproductor propio, índice de capítulos y
comentarios.

**Admin** — 15 tabs: usuarios, asignaciones, distribuciones, límites, dominios,
stacks, plantillas, tutoriales, identidad de la IA, cerebro (RAG), colores,
logos, ofertas, apps y cuenta.

---

## 5. Inteligencia artificial

Tres superficies, un mismo motor (Gemini):

1. **Asistente** (widget flotante) — RAG + *tool calling*. Ejecuta acciones
   reales con las mismas reglas de permisos que la UI, reusando los
   procedimientos tRPC con un caller interno.
2. **`/ia` en el chat global** — participa de la conversación del equipo. Tiene
   una restricción dura: **nunca revela datos privados ni financieros**, porque
   el chat es grupal.
3. **Ángulos** — generación y base de conocimiento con feedback (👍/👎) que se
   consolida en aprendizajes.

**RAG**: `KnowledgeChunk` con `vector(768)` (pgvector), embeddings
`gemini-embedding-001`, similitud coseno e índice HNSW.

**Identidad configurable** (Admin → Identidad IA): nombre, foto y personalidad
en `AppConfig`. El nombre se resuelve **al leer**, así que renombrarla también
reetiqueta los mensajes ya enviados.

---

## 6. Almacenamiento

| Qué | Dónde | Por qué |
|---|---|---|
| Imágenes (logos, ángulos, avatares) | Supabase Storage | `/api/upload`, máx. 25 MB, convierte HEIC |
| Video de tutoriales | **S3 + CloudFront** | Supabase topea en 50 MB por archivo |

Los videos **suben directo del navegador a S3** con URL prefirmada. No es una
optimización: nginx corta los bodies en 1 MB por defecto y bufferear cientos de
MB tumbaría el VPS.

La firma **SigV4 está escrita a mano** con `node:crypto` (sin `@aws-sdk/*`, por
la restricción del deploy) y se validó contra el vector de prueba oficial de AWS.
Solo se firma el header `host`, lo que además evita el 403 por checksum que sí
sufre el SDK en subidas desde el navegador.

Variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
`AWS_S3_REGION`, `AWS_S3_BUCKET`, `AWS_S3_PREFIX`, `CLOUDFRONT_DOMAIN`. Si
faltan, cae a Supabase automáticamente.

---

## 7. El panel como app

- **i18n propio**: diccionario con el **español como clave**. `t("Nueva campaña")`
  devuelve el inglés; lo que no esté traducido cae al español en vez de romperse.
  473 entradas. Server usa `await getT()`; cliente usa un `t` de módulo (seguro
  porque el navegador tiene un solo idioma activo, a diferencia del server, donde
  el estado de módulo se compartiría entre requests).
- **PWA instalable en iOS**: manifest, iconos derivados del logo y las metas de
  Apple. Dos detalles que deciden si funciona: `manifest.json` excluido del
  middleware de auth, y `apple-mobile-web-app-capable` explícito (Next solo emite
  el estándar nuevo, que iOS < 16.4 ignora).
- **Safe area**: utilidades `safe-top` / `safe-bottom` / `safe-x` sobre
  `env(safe-area-inset-*)`. Los insets laterales usan **margin, no padding**,
  para no pisar utilidades de Tailwind del mismo peso.

---

## 8. Integraciones externas

| Servicio | Para qué | Autenticación |
|---|---|---|
| **TapRain** | ofertas, stats, postback | API key |
| **TapRain Ads Suite** | tarjetas virtuales | cookie de sesión (rotable desde la UI) |
| **DripFeed Panel** | likes / comentarios / saves | `SMM_KEY` |
| **IPRoyal** | proxies | API |
| **TikTok** | pixel (`ClickButton`), oEmbed de sparks | ID público |
| **Google Gemini** | asistente, ángulos, embeddings | `GOOGLE_AI_KEY` |
| **ipwho.is** | país del visitante | sin key |
| **AWS S3 / CloudFront** | video | SigV4 |

---

## 9. Operación

```bash
# Deploy
cd ~/tapsur/landing-page-generator
git pull && npx prisma generate && rm -rf .next && npm run build
pm2 restart tapsur --update-env
```

- `npx prisma generate` es **obligatorio** cuando cambia el schema; si no, el
  cliente no conoce los modelos nuevos y falla en runtime.
- Las migraciones se aplican con scripts `.cjs` contra la Supabase compartida
  (`ADD COLUMN IF NOT EXISTS`), no con `prisma migrate`.
- El build necesita RAM: si el VPS se queda sin memoria, agregar swap o parar
  `tapsur` mientras compila.

---

## 10. Deuda conocida

- **CTAs sticky de las landings** (classic, quest, v2) no contemplan la barra de
  gestos del iPhone: el botón principal queda parcialmente tapado. Afecta
  conversión directamente.
- La migración de i18n cubre el panel; **las cadenas nuevas hay que agregarlas al
  diccionario** o quedan en español.
- `ChatMessage.userId` es texto suelto sin relación a `User`, así que los avatares
  se resuelven en una consulta aparte.
- El chat global se **borra solo a los 7 días** (poda al leer, sin cron).
