import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { startGoogleSignIn } from "@/lib/auth";
import { Aurora } from "@/components/reactbits/aurora";
import { BlurText } from "@/components/reactbits/blur-text";
import { ShinyText } from "@/components/reactbits/shiny-text";
import { BorderBeam } from "@/components/magic/border-beam";
import { BlurFade } from "@/components/magic/blur-fade";
import { DotPattern } from "@/components/magic/dot-pattern";
import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Marquee } from "@/components/magic/marquee";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const Google = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" fillOpacity=".8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#fff" fillOpacity=".6" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#fff" fillOpacity=".9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
);

const SITES = ["github.com", "figma.com", "linear.app", "vercel.com", "notion.so", "arxiv.org", "news.ycombinator.com", "developer.mozilla.org", "tailwindcss.com", "dribbble.com"];

export function Login({ busy, error, onToken }: { busy: boolean; error: string; onToken: (t: string) => void }) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  return (
    <main className="relative grid min-h-full place-items-center overflow-hidden px-4 py-10">
      <Aurora />
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
      <div className="relative z-10 w-full max-w-[400px]">
        <BlurFade>
          <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-surface/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <BorderBeam size={120} duration={9} />
            <div className="flex flex-col items-center text-center">
              <Logo size={44} />
              <h1 className="mt-5 text-[26px] font-semibold tracking-tight">
                <BlurText text="Welcome to MarkBase" />
              </h1>
              <p className="mt-2 text-sm"><ShinyText text="Every bookmark, everywhere you browse." /></p>
            </div>

            <ShimmerButton className="mt-8 w-full" disabled={busy} onClick={() => startGoogleSignIn()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Google />}
              {busy ? "Signing you in…" : "Continue with Google"}
            </ShimmerButton>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-subtle">
              <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
            </div>

            {showToken ? (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (token.trim()) onToken(token); }}>
                <Input autoFocus type="password" placeholder="mb_sync_…" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Sync token" />
                <Button type="submit" className="w-full" disabled={!token.trim()}>Connect</Button>
              </form>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowToken(true)}><KeyRound /> Use a sync token</Button>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</p>}
          </div>
        </BlurFade>

        <BlurFade delay={0.4}>
          <Marquee className="mt-10" duration={50}>
            {SITES.map((s) => (
              <span key={s} className="mx-1 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs text-muted">
                <img src={`https://www.google.com/s2/favicons?sz=32&domain=${s}`} alt="" className="size-3.5 rounded-sm" />{s}
              </span>
            ))}
          </Marquee>
        </BlurFade>
      </div>
    </main>
  );
}
