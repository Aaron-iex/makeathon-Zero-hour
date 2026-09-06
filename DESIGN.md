# DESIGN.md — Zeroth Hour: Tactical Telemetry

> Design language specification for **Project Zeroth Hour** — Makeathon event site.
> All visual, typographic, and motion decisions are locked here.
> Every component edit MUST reference this document.

---

## 1. Theme Identity

| Property       | Value                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **Theme name** | Zeroth Hour — Tactical Telemetry                                                                         |
| **Aesthetic**  | Dark CRT command terminal × aviation HUD × declassified                                                  |
| **Mood**       | Urgent, precise, high-stakes — not flashy, not playful                                                   |
| **Anti-goals** | No neon rainbow gradients, no glassmorphism, no rounded-everything, no generic "vibe-coded" AI aesthetic |

---

## 2. Color Substrate

All colors use **oklch** format. No hex, no hsl.

### 2.1 Core Palette (already in styles.css)

| Token                | Value                 | Role                                      |
| -------------------- | --------------------- | ----------------------------------------- |
| `--background`       | `oklch(0.13 0.0 0)`   | CRT black substrate                       |
| `--foreground`       | `oklch(0.95 0.0 0)`   | Phosphor white text                       |
| `--primary`          | `oklch(0.61 0.22 35)` | Aviation-red / alert — CTAs, danger zones |
| `--accent`           | `oklch(0.85 0.18 90)` | Warning amber — dates, venue, highlights  |
| `--muted-foreground` | `oklch(0.70 0.0 0)`   | Greyed-out metadata                       |

### 2.2 Extended Accent Palette (new)

| Token              | Value                  | Role                                         | Usage Rule                       |
| ------------------ | ---------------------- | -------------------------------------------- | -------------------------------- |
| `--terminal-green` | `oklch(0.72 0.18 145)` | Status-OK indicator, "TRANSMITTING" dot      | **One element per viewport max** |
| `--radar-cyan`     | `oklch(0.78 0.12 205)` | Info-tier accents, radar sweep, chart colors | Secondary highlights only        |

### 2.3 Usage Rules

- **Primary red** = danger, registration CTAs, section borders, urgent labels
- **Accent amber** = dates, venue, "PRESENTS" tag, warning badges
- **Terminal green** = single pulsing status dot only — never for text blocks
- **Radar cyan** = chart highlights, subtle info badges — never competing with red

---

## 3. Typography

| Tier        | Family          | Token              | Usage                                                           |
| ----------- | --------------- | ------------------ | --------------------------------------------------------------- |
| **Display** | Orbitron        | `--font-display`   | H1–H4, MAKEATHON title, prize amounts                           |
| **Body**    | Rajdhani        | `--font-body`      | Paragraphs, descriptions, card body text                        |
| **Mono**    | Share Tech Mono | `--font-mono-tech` | All metadata, labels, timestamps, tags, badges, status readouts |

### 3.1 Sizing Rules

- Hero numerals: `clamp(2.5rem, 10vw, 7rem)`
- Section headings: `clamp(1.5rem, 5vw, 3rem)` in `--font-display`
- Mono metadata: `text-[9px] sm:text-[10px] md:text-[11px]` — never larger than body
- Body text: `text-sm sm:text-base` in `--font-body`

### 3.2 No Additional Fonts

Three web fonts is the maximum. No Playfair Display, no Inter, no system font stacks for visible text.

---

## 4. Symbology & Labeling

These ASCII/symbolic conventions reinforce the tactical aesthetic:

| Pattern                | Example                       | Usage                      |
| ---------------------- | ----------------------------- | -------------------------- |
| Bracket framing        | `[ SECTOR 01 ]`               | Category tags              |
| Double-slash separator | `SEPT 23 // 5-HOUR MAKEATHON` | Inline metadata separation |
| Crosshair corners      | `+` marks at card corners     | Card decoration            |
| Registration mark      | `®`                           | Footer legal               |
| Version string         | `ZH // REV 2.6 // 2026`       | Nav/footer stamp           |
| Status dot             | `● TRANSMITTING`              | Single green pulse in nav  |
| Mono prefix            | `STAGE / 01`                  | Timeline labels            |

---

## 5. Post-Processing Layers

Applied globally as fixed overlays or per-section utilities:

| Layer              | Implementation                             | Opacity | Notes                                  |
| ------------------ | ------------------------------------------ | ------- | -------------------------------------- |
| **Scanlines**      | `repeating-linear-gradient` pseudo-element | 22%     | Already exists as `.scanlines`         |
| **Scanlines thin** | 2px line variant                           | 15%     | New utility `.scanlines-thin`          |
| **Film grain**     | Fixed SVG `<feTurbulence>` overlay         | 4%      | Full-screen, `mix-blend-mode: overlay` |
| **Grid tactical**  | 56px grid lines                            | 25%     | Already exists as `.grid-tactical`     |

---

## 6. Motion System

### 6.1 Principles

1. **Every animation uses `transform` and `opacity` only** — GPU-accelerated, no layout thrash
2. **Scroll-triggered reveals via GSAP ScrollTrigger** — elements animate once as they enter viewport
3. **Hover physics via Framer Motion** — `whileHover` with spring physics on every interactive card
4. **`prefers-reduced-motion: reduce`** — all animations collapse to instant transitions

### 6.2 GSAP ScrollTrigger Patterns

| Animation         | Properties                                 | Trigger            |
| ----------------- | ------------------------------------------ | ------------------ |
| **Fade-up**       | `y: 40 → 0, opacity: 0 → 1`                | `start: "top 85%"` |
| **Scale-fade**    | `scale: 0.92 → 1, opacity: 0 → 1`          | `start: "top 80%"` |
| **Stagger group** | Children stagger `0.08s`                   | Parent enters view |
| **Scrub text**    | `opacity`, `filter: blur()` tied to scroll | `scrub: true`      |

### 6.3 Framer Motion Hover Physics

```tsx
// Standard card hover
whileHover={{ scale: 1.02, y: -2 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}
```

### 6.4 Performance Budget

- No Three.js — bundle size exceeds budget for Cloudflare Workers deployment
- Framer Motion + GSAP ScrollTrigger = sufficient for Awwwards-level motion
- Canvas animations (EmberCanvas) capped at 16 particles on mobile (<640px)
- All `will-change` properties explicitly declared in CSS

---

## 7. Component Visual Rules

### 7.1 Cards

- Border: `1px solid` using `color-mix(in oklab, var(--primary) 30%, transparent)`
- Background: `var(--gradient-panel)` or `bg-card`
- Clip: `clip-tactical` (chamfered corners)
- Hover: Framer Motion spring scale + glow shadow
- Crosshair `+` marks at corners via `.ascii-corners` pseudo-elements

### 7.2 Buttons

- Primary CTA: `variant="alert"` — gradient red → amber with scanline overlay
- Secondary: `variant="tactical"` — border-only, mono label
- All buttons: `cursor-pointer`, `touch-manipulation`, min-height 44px

### 7.3 Dialogs/Modals

- Portaled to `document.body` via `createPortal`
- Full-viewport scroll container for mobile
- Mono field labels, aviation-red required asterisks

### 7.4 Status Indicators

- Green dot: `--terminal-green`, pulsing, single instance per viewport
- Amber: in-progress / warning
- Red: urgent / live

---

## 8. Section Ordering (LOCKED — DO NOT CHANGE)

```
EmergencyTicker
SiteNav
─── Home tab ───
  Hero
  Sectors
  SabotageQuiz
  Roadmap
─── Events tab ───
  (content TBD)
─── About tab ───
  Intel
  Sponsors
SiteFooter
RegisterDialog (modal overlay)
```

Header position, section order, and overall layout placement are **frozen**.
All upgrades are purely visual/motion treatments within existing containers.

---

## 9. CSS Utility Classes

### 9.1 Existing (preserve)

`clip-tactical`, `panel-tactical`, `text-alert-gradient`, `scanlines`, `grid-tactical`, `shimmer-text`, `glow-border`, `neon-text`, `neon-text-accent`, `glitch-text`

### 9.2 New (to add)

| Class                 | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `.scanlines-thin`     | 2px scanline at 15% opacity — lighter variant                    |
| `.ascii-corners`      | Crosshair `+` marks at all four corners via `::before`/`::after` |
| `.telemetry-readout`  | Mono field with blinking caret animation                         |
| `.border-rotate-fast` | 2s rotation variant for urgent elements                          |
| `.noise-overlay`      | Fixed SVG turbulence grain at 4% opacity                         |

---

## 10. Deployment Constraints

| Constraint        | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Platform**      | Cloudflare Workers via Nitro                                 |
| **Framework**     | TanStack Start + Vite                                        |
| **Max client JS** | ~500KB gzipped (current: ~198KB gzipped)                     |
| **Git rules**     | No force push, no history rewrite (Lovable/Vercel connected) |
| **Font limit**    | 3 web fonts maximum                                          |
| **3D/WebGL**      | Not permitted — bundle cost exceeds budget                   |
