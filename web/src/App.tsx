import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { completeGoogleLogin, getSession, getToken, onPopupToken, saveToken, signOut, type Session } from "@/lib/auth";
import { AuthError, api } from "@/lib/api";
import { StoreProvider } from "@/lib/store";
const Login = lazy(() => import("@/views/Login").then((m) => ({ default: m.Login })));
const Shell = lazy(() => import("@/views/Shell").then((m) => ({ default: m.Shell })));


const wantsAppReturn = () => {
  const q = new URLSearchParams(location.search);
  
  if (q.get("app") === "1") { sessionStorage.setItem("mb_app", "1"); history.replaceState(null, "", location.pathname); }

  return sessionStorage.getItem("mb_app") === "1";
};

export function App({ redirectToken }: { redirectToken?: string }) {
  const [appReturn] = useState(wantsAppReturn);
  const [handoff, setHandoff] = useState("");
  const [token, setToken] = useState(getToken());
  const [session, setSession] = useState<Session | null>(getSession());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = useCallback(async (t: string) => {
    try { await api.bookmarks(t); setError(""); }
    catch (e) { if (e instanceof AuthError) { setToken(""); setError("That token was rejected. Check it and try again."); } }
  }, []);

  const googleLogin = useCallback(async (accessToken: string) => {
    setBusy(true);
    
    const { session: s, message } = await completeGoogleLogin(accessToken);
    setBusy(false);

    if (s) { setSession(s); setToken(s.token); if (message) setError(message); }
    else setError(message || "Google sign-in failed");
  }, []);

  useEffect(() => { if (redirectToken) googleLogin(redirectToken); }, [redirectToken, googleLogin]);
  useEffect(() => onPopupToken(googleLogin), [googleLogin]);
  useEffect(() => { if (token) verify(token); }, [token, verify]);

  useEffect(() => {
    if (!appReturn || !token) return;
    sessionStorage.removeItem("mb_app");

    const u = new URL("markbase://auth");
    
    u.searchParams.set("token", token);
    u.searchParams.set("endpoint", location.origin);
    
    if (session?.name) u.searchParams.set("name", session.name);
    if (session?.email) u.searchParams.set("email", session.email);
    
    setHandoff(u.toString());
    location.href = u.toString();
  }, [appReturn, token, session]);

  const connect = (t: string) => { saveToken(t.trim()); setToken(t.trim()); setError(""); };
  const logout = () => { signOut(); setToken(""); setSession(null); toast("Signed out"); };

  if (handoff) {
    return (
      <main className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">You're signed in</p>
          <p className="mt-1 text-sm text-muted">Returning to the MarkBase app…</p>
          <a href={handoff} className="mt-6 inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-white">Open MarkBase</a>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={null}>
      {token
        ? <StoreProvider session={session} error={error} onLogout={logout} onToken={connect}><Shell /></StoreProvider>
        : <Login busy={busy} error={error} onToken={connect} />}
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#151519", border: "1px solid #2b2b34", color: "#fafafa" } }} />
    </Suspense>
  );
}
