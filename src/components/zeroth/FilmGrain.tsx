/**
 * FilmGrain — DESIGN.MD §5
 * Global SVG noise overlay at 4% opacity.
 * Fixed fullscreen, pointer-events: none, mix-blend-mode: overlay.
 * Renders once in root layout.
 */
export function FilmGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] opacity-[0.04] mix-blend-overlay"
      aria-hidden
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="zh-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#zh-grain)" />
      </svg>
    </div>
  );
}
