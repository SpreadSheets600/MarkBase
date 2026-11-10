// Session + Google OAuth. Storage keys are shared with the browser extension's
// session bridge (extension/session-bridge.js), which is what gives login parity.
export const GOOGLE_CLIENT_ID =
  "471983322621-0rjrhda67jsamkpbh0onjat0erotk9bk.apps.googleusercontent.com";
const TOKEN_KEY = "markbase_token";
const SESSION_KEY = "markbase_session";
const HANDOFF_KEY = "markbase_oauth_handoff";
const CHANNEL = "markbase_auth";

export type Session = { name: string; email: string; picture: string; token: string };

const parse = <T,>(s: string | null): T | null => { try { return s ? (JSON.parse(s) as T) : null; } catch { return null; } };

export const getSession = () => parse<Session>(localStorage.getItem(SESSION_KEY));
export const getToken = () => getSession()?.token || localStorage.getItem(TOKEN_KEY) || "";

export function saveSession(s: Session) {
  if (s.token) localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  // Tell the extension content script (same page) to forward credentials.
  window.postMessage({ type: "markbase_session_updated", session: s, token: s.token }, "*");
  window.dispatchEvent(new CustomEvent("markbase_auth_change", { detail: s }));
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  const s = getSession();
  if (s) saveSession({ ...s, token });
  else window.postMessage({ type: "markbase_session_updated", session: null, token }, "*");
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Google's account pages send Cross-Origin-Opener-Policy, which severs
 * window.opener after the popup comes back. So the popup hands the token to the
 * main window through BroadcastChannel / localStorage instead of postMessage.
 */
export function startGoogleSignIn(): boolean {
  const state = "popup";
  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: location.origin + "/",
      response_type: "token",
      scope: "openid profile email",
      prompt: "select_account",
      state,
    });
  const w = 480, h = 640;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(url, "markbase_google", `width=${w},height=${h},left=${left},top=${top}`);
  if (!popup) {
    location.href = url.replace("state=popup", "state=redirect");
    return false;
  }
  return true;
}

/** Runs before React mounts. Returns the token when this page is a full-page redirect return. */
export function consumeOAuthReturn(): { token?: string; popup: boolean } {
  if (!location.hash.includes("access_token=")) return { popup: false };
  const p = new URLSearchParams(location.hash.slice(1));
  const token = p.get("access_token") || "";
  const popup = p.get("state") === "popup";
  history.replaceState(null, "", location.pathname + location.search);
  if (popup && token) {
    try { new BroadcastChannel(CHANNEL).postMessage({ token }); } catch { /* fall through */ }
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({ token, at: Date.now() }));
    setTimeout(() => window.close(), 150);
    return { popup: true };
  }
  return { token, popup: false };
}

/** Main window: be notified when the popup finishes. */
export function onPopupToken(cb: (token: string) => void) {
  const seen = new Set<string>();
  const fire = (t: string) => { if (t && !seen.has(t)) { seen.add(t); cb(t); } };
  let bc: BroadcastChannel | null = null;
  try { bc = new BroadcastChannel(CHANNEL); bc.onmessage = (e) => fire(e.data?.token); } catch { /* unsupported */ }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== HANDOFF_KEY || !e.newValue) return;
    fire(parse<{ token: string }>(e.newValue)?.token || "");
    localStorage.removeItem(HANDOFF_KEY);
  };
  window.addEventListener("storage", onStorage);
  return () => { bc?.close(); window.removeEventListener("storage", onStorage); };
}

/** Exchange a Google access token for a MarkBase session. */
export async function completeGoogleLogin(accessToken: string): Promise<{ session?: Session; message?: string }> {
  let profile: { name?: string; email?: string; picture?: string } | null = null;
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { authorization: `Bearer ${accessToken}` } });
    if (r.ok) profile = await r.json();
  } catch { /* handled below */ }

  let serverToken = "";
  let serverUser: Partial<Session> | undefined;
  let error = "";
  try {
    const res = await fetch("/v1/auth/google", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, ...profile }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) { serverToken = (body.token || "").trim(); serverUser = body.user; }
    else error = body?.error || "";
  } catch { error = "Couldn't reach MarkBase."; }

  const email = profile?.email || serverUser?.email || "";
  if (!email) return { message: error || "Google sign-in failed. Try again." };
  const session: Session = {
    name: profile?.name || serverUser?.name || "You",
    email,
    picture: profile?.picture || serverUser?.picture || "",
    token: serverToken || getToken(),
  };
  saveSession(session);
  return { session, message: session.token ? undefined : error || `Signed in as ${email}. Add your sync token to finish.` };
}
