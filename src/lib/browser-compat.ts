/**
 * Universal Browser Compatibility & Feature Detection Module
 * Feature detection (not brittle UA string sniffing) and polyfills/fallbacks.
 */

class BrowserCompat {
  private _isTouch?: boolean;
  private _supportsStorage?: boolean;
  private _supportsObserver?: boolean;
  private _supportsCanvas?: boolean;

  /** Check if device supports touch input */
  isTouchDevice(): boolean {
    if (this._isTouch !== undefined) return this._isTouch;
    if (typeof window === "undefined") return false;
    this._isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    return this._isTouch;
  }

  /** Check if localStorage is supported and accessible (handles disabled/private mode) */
  supportsLocalStorage(): boolean {
    if (this._supportsStorage !== undefined) return this._supportsStorage;
    if (typeof window === "undefined") return false;
    try {
      const testKey = "__zh_compat_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      this._supportsStorage = true;
    } catch {
      this._supportsStorage = false;
    }
    return this._supportsStorage;
  }

  /** Check if IntersectionObserver is available natively */
  supportsIntersectionObserver(): boolean {
    if (this._supportsObserver !== undefined) return this._supportsObserver;
    if (typeof window === "undefined") return false;
    this._supportsObserver =
      "IntersectionObserver" in window &&
      "IntersectionObserverEntry" in window &&
      "intersectionRatio" in window.IntersectionObserverEntry.prototype;
    return this._supportsObserver;
  }

  /** Check if 2D Canvas rendering is supported */
  supportsCanvas(): boolean {
    if (this._supportsCanvas !== undefined) return this._supportsCanvas;
    if (typeof window === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      this._supportsCanvas = !!(canvas.getContext && canvas.getContext("2d"));
    } catch {
      this._supportsCanvas = false;
    }
    return this._supportsCanvas;
  }

  /** Check if requestAnimationFrame is available natively */
  supportsRequestAnimationFrame(): boolean {
    if (typeof window === "undefined") return false;
    return typeof window.requestAnimationFrame === "function";
  }

  /** Check user preference for reduced motion */
  prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /** Safe requestAnimationFrame with setTimeout fallback */
  safeRAF(callback: FrameRequestCallback): number {
    if (typeof window === "undefined") return 0;
    if (this.supportsRequestAnimationFrame()) {
      return window.requestAnimationFrame(callback);
    }
    return window.setTimeout(() => callback(performance.now()), 16);
  }

  /** Safe cancelAnimationFrame with clearTimeout fallback */
  safeCancelRAF(id: number): void {
    if (typeof window === "undefined") return;
    if (this.supportsRequestAnimationFrame()) {
      window.cancelAnimationFrame(id);
    } else {
      window.clearTimeout(id);
    }
  }
}

export const browserCompat = new BrowserCompat();
