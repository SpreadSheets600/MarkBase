import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
export const faviconOf = (u: string) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostOf(u))}`;
