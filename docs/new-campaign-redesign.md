# Rediseño — Nueva campaña ("Campaign Studio")

Plan de diseño para ultra-mejorar `/campaigns/new` (componente `src/components/campaign-form.tsx`).
Escrito con la skill **frontend-design**. No implementado todavía — esto es la dirección a seguir.

---

## 1. El sujeto (de dónde sale la personalidad)

Crear una campaña en TapSur **no es llenar un formulario**: es **componer una landing que genera plata**. El artefacto final es una página mobile vívida (juego/oferta, CTA brillante, ofertas cayendo). Y quien la usa es un **operador que crea muchas campañas seguidas** (power user), no alguien que entra una vez.

Dos consecuencias de diseño que mandan sobre todo lo demás:

1. **El preview es el héroe, no la cabecera.** Lo más característico del mundo del sujeto es ver la landing cobrar vida mientras la armás. El preview tiene que estar **siempre presente y reaccionar en vivo**, no escondido detrás de un botón "Ver preview".
2. **Velocidad para el experto > onboarding para el novato.** Un wizard que bloquea paso a paso agrega fricción a quien crea su campaña #40. La guía por secciones sí, pero **sin bloquear**.

---

## 2. Decisión: ¿wizard paso a paso o una sola página?

El usuario propuso "paso a paso por sección con animaciones". Mi recomendación, por best practices para **un config-form cuyo resultado es visual**:

> **Studio de dos paneles** con un **rail de pasos NO bloqueante** a la izquierda y un **preview de teléfono en vivo, sticky, a la derecha.**

Por qué esto y no un wizard clásico:

| | Wizard bloqueante | **Studio + rail (elegido)** | Una sola página (actual) |
|---|---|---|---|
| Carga cognitiva | Baja ✅ | Baja ✅ (una sección activa a la vez) | Alta ❌ (todo de golpe) |
| Velocidad power-user | Lenta ❌ (muchos next) | Rápida ✅ (saltás a cualquier sección) | Rápida ✅ |
| Feedback visual | Nulo ❌ (preview escondido) | **Vivo ✅** (preview siempre) | Modal aparte ❌ |
| Sensación de progreso | Alta ✅ | Alta ✅ (checks por sección) | Nula ❌ |

El rail te da la sensación de "paso a paso" y las animaciones que querés, pero **podés editar cualquier sección cuando quieras** y **siempre ves el resultado**. Lo mejor de los dos.

> Extra opcional: un overlay de **"primer uso"** (coach marks) que aparece solo la primera vez (localStorage), para guiar al novato sin penalizar al experto.

---

## 3. Tokens

Reutilizamos la paleta Vercel dark existente, con un giro distintivo.

**Color**
- Base: `--color-background #000`, `--color-surface-raised #111`, `--color-surface-overlay #1a1a1a`, borders `rgba(255,255,255,0.08)`.
- Texto: `#ededed` / `#888` / `#444`.
- Verde `--color-success #50e3c2` solo para validación OK / completado.
- **Giro de firma:** la UI del formulario **adopta el `colorPrimary` que el usuario elige para la campaña**. El marcador del paso activo, la barra de progreso y el foco de inputs usan ese color en vivo. Estás construyendo una marca → la herramienta se tiñe de esa marca. (Estructura = información, no decoración.)

**Tipografía** (3 roles, ya disponibles)
- **Display / títulos de sección / números de paso:** Satoshi (`--font-brand`), 700–900, tracking ajustado.
- **Body / labels / ayudas:** Geist sans.
- **Mono (identificadores de máquina):** Geist Mono para **slug, URL de afiliado/tracking, valores de color (`oklch(...)`), s1/s2**. El mono comunica "esto es un identificador técnico" y separa visualmente lo editable-humano de lo técnico.

**Radios/espacio:** `--radius 0.375rem` para inputs; cards de sección `rounded-2xl`. Aire generoso entre secciones (la densidad actual es plana y cansa).

---

## 4. Layout

```
┌───────────────────────────────────────────────────────────────┐
│  ← Campañas        Nueva campaña            [• Borrador]        │  top bar
├───────────────────────────────┬───────────────────────────────┤
│  RAIL + SECCIÓN ACTIVA        │   PREVIEW EN VIVO (sticky)      │
│                               │                                 │
│  ① ● Identidad      ✓         │        ┌─────────────┐          │
│  ② ○ Mercado                  │        │   ▟ logo    │          │
│  ③ ○ Oferta / CTA             │        │  Earn money │          │
│  ④ ○ Marca (logo+color)       │        │  [ CTA ]    │  ← reacciona
│  ⑤ ○ Aplicaciones             │        │  🎮 🎮 🎮   │     en vivo
│  ⑥ ○ Lanzar                   │        └─────────────┘          │
│                               │                                 │
│  ┌─ sección activa ─────────┐ │   [iPhone frame, colorBg real]  │
│  │ campos de la sección      │ │                                 │
│  └───────────────────────────┘ │                                 │
├───────────────────────────────┴───────────────────────────────┤
│  Progreso ▰▰▰▱▱▱   [ Cancelar ]            [ Crear campaña → ]   │  sticky action bar
└───────────────────────────────────────────────────────────────┘
```

**Izquierda — rail de pasos + sección activa**
- Rail vertical compacto: número (Satoshi) + label + estado (`○` pendiente, `●` activo en `colorPrimary`, `✓` completo en verde). Click = saltar a esa sección.
- Solo la **sección activa expandida**; el resto colapsado (altura animada). Reduce el ruido sin esconder el progreso.
- Orden honesto (no decorativo): Identidad → Mercado → Oferta/CTA → Marca → Aplicaciones → Lanzar. Es la secuencia real con la que se piensa una campaña, por eso numerar es legítimo acá.

**Derecha — preview en vivo (la firma)**
- El frame de teléfono que ya existe (`PreviewModal`) **extraído a un componente reusable** y montado fijo (sticky).
- Reacciona a cada cambio: logo, `colorPrimary`/`colorBg`, moneda/locale, y las apps del stack elegido.

**Bottom — action bar sticky**
- Barra de progreso (% de secciones completas) teñida del `colorPrimary`.
- `Crear campaña` deshabilitado hasta que las secciones mínimas estén OK; muestra qué falta al hover.

**Responsive (mobile)**
- Una sola columna. El rail se vuelve un **stepper horizontal** arriba (scrolleable).
- El preview se colapsa en un **botón flotante "Ver preview"** → **bottom-sheet** que sube (sheet con slide, como ya hicimos en offers). Acción bar fija abajo.

---

## 5. Motion (deliberado, no decorativo)

- **Cambio de sección:** la sección saliente colapsa (height+opacity, ~220ms, ease-out) y la entrante se expande; el indicador del rail se desliza al paso activo.
- **Preview reactivo (el corazón):**
  - `colorPrimary` cambia → el CTA hace **morph de gradiente** + un pulso suave.
  - Aplicás un stack → las app-cards entran en **stagger** (cascada, 60ms entre cada una).
  - Subís el logo → **scale-in** con pequeño overshoot.
- **Validación:** el `✓` del rail se **dibuja** (stroke-dashoffset) cuando la sección queda completa.
- **Lanzar:** reusar/mejorar el check de "campaña creada" actual → momento full-screen con el **color de la campaña**, checkmark dibujado, y CTA directo **"Ver landing →"**.
- **Disciplina:** todo respeta `prefers-reduced-motion` (sin transforms, solo opacidad). Una orquestación (el preview armándose) pega más fuerte que 10 micro-efectos sueltos. Si algo no comunica, se corta.

---

## 6. Mejoras de contenido / copy (por sección)

- **Identidad:** Nombre + Slug (mono, con auto-slug en vivo y botón copiar URL de config). Ayuda: "Se usa como `?c=slug` en la plantilla."
- **Mercado:** Idioma/País + Moneda (auto-setea símbolo). El preview cambia de bandera/símbolo al instante.
- **Oferta / CTA:** URL de afiliado con estado de validación en vivo (✓/✗), `Buscar oferta` (modal ya rediseñado), URLs guardadas. **Mover esta sección antes de Marca** — sin tracking válido, la campaña no convierte; es lo primero que importa.
- **Marca:** Logo (upload + presets) y Colores (presets + pickers). Ambos pintan el preview en vivo.
- **Aplicaciones:** stack picker; al elegir, las apps caen en el preview.
- **Lanzar:** resumen compacto (nombre, slug, locale, color, #apps, estado activo/pausada) + `Crear campaña`. Estado vacío y errores con voz de interfaz, no de persona ("Falta una URL de afiliado válida", no "Ups, parece que…").

Microcopy: verbos activos y consistentes — el botón dice **Crear campaña** y el toast dice **Campaña creada**.

---

## 7. Crítica del estado actual (qué estamos arreglando)

- ❌ Todo en una columna larga y plana: alta carga cognitiva, sin jerarquía ni sensación de avance.
- ❌ El preview está **escondido en un modal** ("Ver preview en mobile") → el feedback visual, que es lo más valioso, queda enterrado.
- ❌ Sin estados de "sección completa" ni validación progresiva: no sabés cuánto te falta.
- ❌ Densidad pareja: nombre, colores oklch y la URL de tracking pesan visualmente igual, cuando son cosas muy distintas.
- ✅ Lo que se conserva y potencia: presets de color/logo, `Buscar oferta`, URLs guardadas, el frame de teléfono y el check de creación (se reusan).

---

## 8. Notas de implementación

- **Extraer** el frame de teléfono de `PreviewModal` a `components/landing-preview.tsx` (recibe `colorPrimary/colorBg/logoUrl/currencySymbol/locale/offers`) y usarlo tanto en el panel sticky como en el bottom-sheet mobile. Una sola fuente de verdad del preview.
- **Estado por sección:** derivar `complete`/`error`/`pending` de los valores ya existentes en `FormValues` (no agregar back-end). Ej: Identidad completa si `name && slug`; CTA completa si `ctaStatus === "valid"`.
- **Sin cambios de tRPC ni schema** — es puramente UI/UX sobre el form actual.
- **Animaciones:** CSS transitions + un par de `@keyframes` (como ya venimos haciendo). No hace falta una lib de animación; si se quisiera spring real, evaluar `motion` (framer) solo para el rail/preview.
- **Accesibilidad:** foco visible con `--color-border-focus`, navegación por teclado del rail (↑/↓ entre pasos), `aria-current` en el paso activo.

---

## 9. Resumen en una línea

Convertir el formulario en un **Campaign Studio**: rail de pasos no bloqueante a la izquierda, **preview de teléfono en vivo** a la derecha que se arma solo mientras completás, la UI teñida del color de la campaña, y un lanzamiento con momento. Guía sin frenar, y el resultado siempre a la vista.
