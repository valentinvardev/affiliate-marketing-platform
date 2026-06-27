# Plan — Tab **Sparks**

Banco de *sparks* de TikTok que el **estrategista** sube y los **usuarios** reclaman
para apropiarse de creativos ya validados. Cada spark = link de TikTok + Spark Code,
con metadata (título, descripción, país, idioma), reclamo exclusivo, marca de
"no usable", visualización tipo player y rating con estrellas.

> Estado: **planificación**. Nada de esto está implementado todavía.

---

## 1. Objetivo y actores

| Actor | Puede |
|---|---|
| **Estrategista** (`role = estrategista`) | Subir sparks, editarlos, marcarlos *no usable*, **botear** (engagement + comentarios), ver feedback/ratings y quién reclamó cada uno. |
| **Admin** (`role = admin`) | Todo lo del estrategista (superset). |
| **Usuario** (`role = user`) | Ver sparks disponibles (filtrados por país/idioma), **reclamar** uno, verlo en *Mis Sparks*, soltar el reclamo, **ratear con estrellas**. |

Regla central: **un spark se reclama una sola vez y se retira del pool** → pasa a la
**biblioteca** del usuario de forma permanente (sin vencimiento). El **Spark Code es
sensible**: sólo se revela al usuario que lo reclamó (y a estrategista/admin). Antes
de reclamar se muestra enmascarado.

---

## 2. Modelo de datos (Prisma)

`prisma/schema.prisma` — 4 modelos nuevos. Migración por script Node local contra el
pooler de Supabase (mismo patrón que `SpendGuard`), luego `npx prisma generate`.

```prisma
model Spark {
  id           String   @id @default(cuid())
  createdById  String                       // estrategista que lo subió
  title        String
  description  String?
  tiktokUrl    String
  sparkCode    String                       // Spark Ads code (sensible)
  countryCode  String                       // ISO-2 objetivo (DE, FR, GB…)
  language     String                       // locale (en, fr, de…)

  // Visualización (cache de oEmbed de TikTok)
  thumbnailUrl String?
  authorName   String?
  embedHtml    String?  @db.Text
  isCarousel   Boolean  @default(false)

  // Estado / disponibilidad
  status       String   @default("available") // available | claimed | disabled
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  claim   SparkClaim?
  ratings SparkRating[]
  boosts  SparkBoost[]

  @@index([status])
  @@index([countryCode, language])
}

model SparkClaim {
  id        String   @id @default(cuid())
  sparkId   String   @unique                  // UN solo reclamo por spark → se retira del pool
  userId    String                            // dueño en su biblioteca (permanente)
  claimedAt DateTime @default(now())

  spark Spark @relation(fields: [sparkId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model SparkRating {
  id        String   @id @default(cuid())
  sparkId   String
  userId    String
  stars     Int                                // 1..5
  comment   String?                            // feedback opcional
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  spark Spark @relation(fields: [sparkId], references: [id], onDelete: Cascade)

  @@unique([sparkId, userId])
  @@index([sparkId])
}

model SparkBoost {
  id           String   @id @default(cuid())
  sparkId      String
  createdById  String
  provider     String   @default("smm")         // proveedor; extensible a más servicios
  interactions Json                              // { views, likes, shares, saves, follows }
  comments     String[] @default([])             // comentarios a postear (en el idioma del spark)
  status       String   @default("pending")      // pending | running | done | failed
  providerRef  String?                            // id del job en el proveedor
  createdAt    DateTime @default(now())

  spark Spark @relation(fields: [sparkId], references: [id], onDelete: Cascade)

  @@index([sparkId])
}
```

### "Limitado" = se reclama una vez y se retira
El `@unique` en `SparkClaim.sparkId` garantiza **un reclamo por spark**. Al reclamar,
`status = claimed`, el spark sale del pool de disponibles y queda **permanentemente**
en la biblioteca de ese usuario (sin vencimiento, no se suelta). No hace falta
`claimLimit/claimCount`. (Si en el futuro se quisiera que rote entre varios, se
agrega un cupo — fuera de alcance ahora.)

---

## 3. Ciclo de vida de un spark

```
                     claim()  (una vez)
   available ───────────────────────────▶ claimed  (permanente, en la biblioteca del usuario)
      │
      │ setUsable(false)            setUsable(true)
      ▼ ◀───────────────────────────────
   disabled  (no usable)
```

- **available**: reclamable. País/idioma **ordenan/sugieren**, no bloquean.
- **claimed**: lo reclamó un usuario; sale del pool y queda en su **biblioteca** con el
  Spark Code revelado. Estado final (sin vencimiento, sin soltar).
- **disabled** ("no usable"): el estrategista lo apaga antes de que lo reclamen; no se
  puede reclamar; se ve atenuado. Reactivable con `setUsable(true)`.

---

## 4. API tRPC — `sparksRouter`

Nuevo `src/server/api/routers/sparks.ts`, registrado en `src/server/api/root.ts`
como `sparks`. Agregar un `estrategistaProcedure` en `src/server/api/trpc.ts`
(rol ∈ `{estrategista, admin}`), análogo a `adminProcedure`.

### Lectura (usuario logueado — `protectedProcedure`)
- `list({ country?, language? })` → sparks **disponibles**, ordenados por afinidad de
  país/idioma del usuario (luego por recientes). **Enmascara `sparkCode`** (sólo
  estrategista/admin lo ven acá). Incluye `avgRating`, `ratingsCount`.
- `library()` → mis sparks reclamados (la **biblioteca**), con el `sparkCode` revelado.
- `detail({ id })` → ficha completa + embed para el player.

### Acciones de usuario
- `claim({ sparkId })` → valida `status = available` (no `disabled`). En **transacción**
  crea el `SparkClaim` (el `@unique` en `sparkId` corta cualquier doble-claim en
  carrera → gana uno solo) y pone `status = claimed`. Devuelve el `sparkCode`. El spark
  queda en mi biblioteca para siempre.
- `rate({ sparkId, stars (1..5), comment? })` → upsert `SparkRating`. Sólo quien lo
  reclamó.

### Estrategista / admin (`estrategistaProcedure`)
- `create({ title, description?, tiktokUrl, sparkCode, countryCode, language,
  claimLimit? })` → al crear, hace **oEmbed server-side** y cachea
  `thumbnailUrl/authorName/embedHtml/isCarousel`.
- `update({ id, ... })`, `remove({ id })`.
- `setUsable({ id, usable })` → marca *no usable* (`disabled`) / reactiva. (Sólo aplica
  a sparks aún `available`; los ya reclamados ya salieron del pool.)
- `boost({ sparkId, provider?, interactions, comments })` → crea `SparkBoost` y lo
  despacha al panel SMM (ver §7).
- `commentBank({ language })` → comentarios sugeridos en ese idioma para prellenar el
  boost (ver §7).
- `feedback({ sparkId? })` → ratings + comentarios (para el dashboard del estrategista).
- `claimsOverview()` → quién tiene/tuvo cada spark.

### Util server
`src/lib/tiktok.ts` → `fetchTiktokOembed(url)` que pega a
`https://www.tiktok.com/oembed?url=<encoded>` y devuelve `{ thumbnail_url, title,
author_name, html }`. Detecta carrusel (foto-mode) por la URL `/photo/` vs `/video/`.

---

## 5. Navegación y páginas

Sidebar (`src/components/sidebar.tsx`): agregar **Sparks** (`/sparks`, icono `Sparkles`
o `Zap`) visible para todos. Las acciones de gestión se muestran según rol dentro de
la página (no hace falta item separado).

```
src/app/(dashboard)/sparks/page.tsx          // grilla + filtros (todos)
src/app/(dashboard)/sparks/biblioteca/page.tsx // "Mi biblioteca" (reclamados)  ── o tab interno
src/app/(dashboard)/sparks/_components/
   spark-card.tsx          // thumbnail + play + país/idioma + rating + botón
   spark-player-modal.tsx  // visualización (embed TikTok / carrusel)
   spark-upload-modal.tsx  // alta (estrategista): URL→preview oEmbed, code, país, idioma
   spark-boost-modal.tsx   // botear: interacciones + lista de comentarios
   star-rating.tsx         // estrellas (lectura + edición)
   spark-feedback-panel.tsx// estrategista: ratings/comentarios por spark
```

### Vista usuario (`/sparks`)
- **Orden** por país/idioma del usuario (no bloquea), con filtros opcionales
  (reutilizar `LOCALES`/`getLocaleByCode` + `ReactCountryFlag`, como en campañas).
- Grilla de `SparkCard`: thumbnail con overlay ▶ (estilo del ejemplo de WhatsApp),
  título, autor, banderita país + idioma, ⭐ promedio, y botón **Reclamar**. El Spark
  Code **no** se muestra acá. Al reclamar, el spark desaparece del pool y aparece en la
  biblioteca.
- **Mi biblioteca**: los reclamados con el **Spark Code revelado + copiar** y el bloque
  de **rating** (estrellas + comentario). Permanentes.

### Vista estrategista (misma página, controles extra)
- Botón **Subir spark** (modal de alta con preview en vivo del oEmbed).
- Por card: **Botear**, **No usable** (toggle), **Editar/Borrar**, y badge de estado
  (disponible / reclamado-por-X / no usable) + acceso al **feedback**.

---

## 6. Visualización del spark (player)

- **Card**: usar `thumbnailUrl` del oEmbed con overlay de play (como el embed de
  WhatsApp de la referencia). Si no hay thumbnail, placeholder con icono.
- **Modal player**: cargar el **embed oficial de TikTok** (`embedHtml` +
  `https://www.tiktok.com/embed.js`) o un `<blockquote class="tiktok-embed">`. El
  embed oficial maneja **video y carruseles (foto-mode)**; es el camino más confiable
  para ver carruseles sin construir un visor propio.
- **Carruseles**: marcar `isCarousel` y, en el player, dejar que el embed oficial
  pagine las fotos. (Un visor propio de slides queda como mejora futura — fuera de
  alcance ahora.)
- Privacidad: el modal muestra el creativo; el **Spark Code sólo** aparece en *Mis
  Sparks* del claimer.

---

## 7. Botear sparks (estrategista)

Botón **Botear** → `spark-boost-modal.tsx`:
- **Interacciones**: toggles + cantidad para `views`, `likes`, `shares`, `saves`,
  `follows`.
- **Comentarios**: lista editable de filas → `string[]`. Se **prellena con el banco de
  comentarios del idioma del spark** (`commentBank({ language })`), así el engagement
  habla el idioma correcto del creativo. El estrategista puede editar/agregar.
- Submit → `sparks.boost` crea `SparkBoost(pending)` y despacha al proveedor.

**Proveedor (extensible):** arranca por el **panel SMM existente** (`/api/smm`),
mapeando cada interacción a su *service id*; `provider` queda como campo para sumar
**más servicios después** sin tocar el modelo. `providerRef` guarda el id del job para
seguir estado (`pending→running→done/failed`).

**Banco de comentarios por idioma:** lista reutilizable por `language` (en/fr/de…).
Para empezar puede vivir como constante/seed o una tabla simple `SparkCommentBank
(language, text)` que el estrategista administra; el modal sólo consume el del idioma
del spark.

> Detalle de integración (mapping interacción→servicio y formato de la orden) =
> **pendiente** del proveedor detrás de `/api/smm`. El modal y el registro `SparkBoost`
> se pueden construir ya; la ejecución real se conecta después.

---

## 8. Rating y feedback

- `star-rating.tsx` reutilizable (1–5, hover, estado).
- Usuario ratea desde *Mis Sparks* (estrellas + comentario opcional) → `sparks.rate`.
- Card muestra **promedio** + cantidad de ratings.
- Estrategista: `spark-feedback-panel.tsx` lista por spark (usuario, ⭐, comentario,
  fecha) y un resumen (promedio, distribución). Útil para retirar los que ratean bajo.

---

## 9. Migración y rollout

1. Agregar los 4 modelos a `prisma/schema.prisma`.
2. Script Node local (pooler) con `CREATE TABLE IF NOT EXISTS` para `Spark`,
   `SparkClaim`, `SparkRating`, `SparkBoost` + índices/uniques. `npx prisma generate`.
3. `estrategistaProcedure` en `trpc.ts`; `sparksRouter` + registro en `root.ts`.
4. `src/lib/tiktok.ts` (oEmbed).
5. Páginas + componentes (§5). Modales con el patrón portal + blur + fade ya usado en
   `campaign-delete.tsx` / `vcc-wallet.tsx`.
6. Item de sidebar.
7. Deploy: `git pull && npx prisma generate && npm run build && pm2 restart tapsur`
   (las tablas se crean desde local, el VPS sólo regenera el client).

---

## 10. Decisiones (cerradas)

1. ✅ **"Limitado"** = se reclama **una sola vez** y se retira del pool → queda en la
   **biblioteca** del usuario de forma permanente.
2. ✅ **País/idioma** = ordenan/sugieren (no bloquean). Además el `language` define el
   **banco de comentarios** que prellena el boost.
3. ✅ **Sin vencimiento** = el reclamo no se suelta ni expira.
4. ✅ **Boost** = por `/api/smm`, con `provider` extensible para **sumar más servicios**
   después.
5. ✅ **Quién ratea** = sólo quien lo reclamó.
6. ✅ **Spark Code** = se revela **sólo** al que lo reclamó (y estrategista/admin).

### Queda por definir al implementar
- Mapping concreto **interacción → service id** del panel SMM (depende del proveedor).
- **Carruseles**: arrancar con el embed oficial de TikTok; visor propio de slides = fase 2.
- Forma del **banco de comentarios** por idioma (constante/seed vs tabla
  `SparkCommentBank`).
```
