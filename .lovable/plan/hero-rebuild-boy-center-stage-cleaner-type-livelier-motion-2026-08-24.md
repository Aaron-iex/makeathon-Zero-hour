# Hero Rebuild: Boy Center Stage, Cleaner Type, Livelier Motion

## The problem today

The hero puts the college header, titles, countdown and stat panels on top of the full cataclysm photo, so the boy's face and figure are covered. The `neon-text` glow blurs the wording and hurts readability. Motion is present but static-feeling, and the mobile stack is cramped.

## What changes

### 1. Boy becomes the centerpiece

- Produce a transparent PNG cutout of the boy (with laptop and backpack) from the existing hero art, plus keep the ruined-city photo as a separate background plate.
- New hero stage layout:
  - Left: `MAKEATHON` (large display type, stacked/rotated to hug the figure)
  - Center: the boy cutout, standing free with nothing overlapping his head or torso — a subtle "pop out" effect (drop shadow, ground glow, slow float, and a parallax tilt that follows pointer / device scroll)
  - Right: `ZEROTH HOUR`
- On mobile the trio restacks: `MAKEATHON` above, boy in the middle at a readable scale, `ZEROTH HOUR` below — still no text over his face.
- Everything currently sitting on top of him (college header block, countdown, stat tiles) moves above or below the stage so the figure keeps clear space. No empty dead gap is left behind — the freed area becomes the figure's stage.

### 2. Remove the neon effect

- Delete the `neon-text` / `neon-text-accent` usages in the hero (and anywhere else they appear) and drop the utilities from `src/styles.css`.
- Replace with crisp legibility: solid token colors, tight tracking, and a soft dark scrim behind text where it sits over imagery, so wording stays sharp.

### 3. Opening disaster animation

- Rebuild the intro as a short cinematic (~1.5s, not skippable by tap/click/scroll):
  - Rapid cut-through of disaster frames — seismic crack, tsunami wall, wildfire ember burst, city blackout — rendered with layered gradients, masks and the existing ember canvas rather than heavy video.
  - Alert lines type in over the frames, then a shutter-wipe reveals the hero with the boy rising into place.
  - Runs once per session (sessionStorage), respects `prefers-reduced-motion`, and never blocks interaction if it fails.

### 4. Livelier, but lighter

- Scroll-reveal for each section (fade + rise via IntersectionObserver), hover lift on sector cards and roadmap phases, animated section dividers.
- Trim always-on animation cost: cap ember particle count and pause canvases when offscreen or on reduced-motion; retire the `glitch-text` flicker on the main title so it stays readable.

### 5. Mobile pass, load screen to registration

- Hero: fluid type scale, no horizontal overflow, countdown digits sized for small screens.
- Nav: larger tap targets, smoother mobile menu, safe-area padding.
- Sections: single-column stacking with the grid + `min-w-0` + `shrink-0` pattern on every mixed text/icon row.
- Register dialog: full-height sheet style on phones, scrollable body, inputs at 16px to stop iOS zoom, sticky submit button.
- Roadmap / Sectors / Intel: horizontal-scroll or stacked variants instead of squeezed grids; verified at 360px, 390px and 768px widths.

## Technical notes

- New assets: `src/assets/hero-boy.png` (transparent cutout) and reuse of the existing cataclysm plate as background.
- `Hero.tsx` restructured into a three-column `grid-cols-[1fr_auto_1fr]` stage on `md+`, single column below; the intro sequence is extracted to `src/components/zeroth/IntroSequence.tsx`.
- Parallax/pop-out via CSS transforms and a small pointer-move hook; no new animation dependency.
- `neon-text` and `neon-text-accent` utilities removed from `src/styles.css` after all call sites are cleaned.
- Verification: production build plus Playwright screenshots of the hero and registration flow at mobile and desktop widths.

## Step 0: fix existing build errors first

The project currently fails typecheck; these are fixed before the hero work:

- `Intel.tsx` — `HOD` and `FACULTY_COORDINATORS` entries have no `linkedin` field, so the optional LinkedIn links error out. Add an optional `linkedin?: string` to the shared member type (or drop the link block for those two groups).
- `Roadmap.tsx:86` — index-signature access: use `map['hacking']`.
- `admin.tsx:41` — index-signature access: use `import.meta.env['VITE_ADMIN_PIN']`.
