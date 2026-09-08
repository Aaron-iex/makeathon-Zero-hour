import { memo } from "react";

/**
 * FilmGrain — DESIGN.MD §5
 * High-performance, GPU-cached CRT phosphor grain overlay.
 * Uses standard alpha compositing (zero mix-blend-mode overhead)
 * to maintain a locked 60fps scroll while providing authentic CRT texture.
 */
export const FilmGrain = memo(function FilmGrain() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 opacity-[0.03] select-none"
      aria-hidden="true"
    >
      <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="crt-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#crt-noise)" fill="transparent" />
      </svg>
    </div>
  );
});
