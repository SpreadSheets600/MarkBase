import { useEffect, useState } from "react";

export type Route =
  | { k: "all" }
  | { k: "collections" }
  | { k: "folder"; name: string }
  | { k: "notes" }
  | { k: "history" }
  | { k: "trash" }
  | { k: "settings" };

export function parse(hash: string): Route {
  const [, k, ...rest] = hash.replace(/^#/, "").split("/");
  const arg = decodeURIComponent(rest.join("/"));
  if (k === "folder" && arg) return { k: "folder", name: arg };
  if (
    k === "collections" ||
    k === "notes" ||
    k === "history" ||
    k === "trash" ||
    k === "settings"
  )
    return { k };
  return { k: "all" };
}
export const href = (r: Route) =>
  "#/" +
  (r.k === "all"
    ? ""
    : r.k === "folder"
      ? "folder/" + encodeURIComponent(r.name)
      : r.k);

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const f = () => setRoute(parse(location.hash));
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return [
    route,
    (r) => {
      location.hash = href(r);
    },
  ];
}
