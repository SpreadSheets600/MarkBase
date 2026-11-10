import { useSyncExternalStore } from "react";

type Prefs = { layout: "grid" | "list"; cols: 2 | 3 | 4 };
const KEY = "markbase_prefs";
const read = (): Prefs => {
  try {
    return {
      layout: "grid",
      cols: 4,
      ...JSON.parse(localStorage.getItem(KEY) || "{}"),
    };
  } catch {
    return { layout: "grid", cols: 4 };
  }
};
let cache = read();
const subs = new Set<() => void>();

export const setPrefs = (p: Partial<Prefs>) => {
  cache = { ...cache, ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  subs.forEach((f) => f());
};
export const usePrefs = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => cache,
  );

export const GRID: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};
