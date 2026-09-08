import { browserCompat } from "./browser-compat";

/** In-memory fallback store when localStorage is restricted or quota exceeded */
const memoryStore = new Map<string, string>();

/** Keys for persistent state entries across the application */
export const STORAGE_KEYS = {
  ACTIVE_TAB: "zh_active_tab",
  TAB_SCROLLS: "zh_tab_scroll_positions",
  REGISTRATION_DRAFT: "zh_registration_form_draft",
  REGISTRATION_MODAL: "zh_registration_modal_state",
  SECTOR_CRISIS: "zh_sectors_selected_crisis",
  ROADMAP_FILTER: "zh_roadmap_active_filter",
  INTEL_ACCORDION: "zh_intel_accordion_index",
  INTRO_PLAYED: "zh_intro_sequence_played",
} as const;

/**
 * Save data to storage with resilient fallback handling
 */
export function saveState<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(data);
    if (browserCompat.supportsLocalStorage()) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (err) {
    console.warn(`StatePersistence: Failed to save state for key "${key}"`, err);
    try {
      memoryStore.set(key, JSON.stringify(data));
    } catch {
      // Memory allocation fallback failed silently
    }
  }
}

/**
 * Load data from storage with fallback default values
 */
export function loadState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    let raw: string | null = null;
    if (browserCompat.supportsLocalStorage()) {
      raw = window.localStorage.getItem(key);
    }
    if (!raw && memoryStore.has(key)) {
      raw = memoryStore.get(key) || null;
    }
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`StatePersistence: Failed to load state for key "${key}", using fallback`, err);
    return fallback;
  }
}

/**
 * Clear a specific key from storage
 */
export function clearState(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (browserCompat.supportsLocalStorage()) {
      window.localStorage.removeItem(key);
    }
    memoryStore.delete(key);
  } catch (err) {
    console.warn(`StatePersistence: Failed to clear state for key "${key}"`, err);
  }
}

/**
 * Generic debounce utility function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };
}
