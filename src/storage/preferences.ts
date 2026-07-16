export type ThemePreference = "dark" | "light" | "system";
export type DensityPreference = "comfortable" | "compact";

const prefix = "csrf-forge:";

export function getPreference(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(`${prefix}${key}`);
}

export function setPreference(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${prefix}${key}`, value);
}
