/**
 * Where to go after logging in: the `?next=` path if it's on this site,
 * otherwise the fallback. Never follows absolute or protocol-relative URLs
 * (that would let a crafted link send people to another site after login).
 */
export function nextPath(fallback = "/dashboard") {
  if (typeof window === "undefined") return fallback;

  const next = new URLSearchParams(window.location.search).get("next");

  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** Login URL that returns to the current page afterwards. */
export function loginUrlForHere() {
  const here = `${window.location.pathname}${window.location.search}`;
  return here && here !== "/" ? `/login?next=${encodeURIComponent(here)}` : "/login";
}
