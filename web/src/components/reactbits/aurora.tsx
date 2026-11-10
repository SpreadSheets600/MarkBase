// React Bits - Aurora (lightweight CSS variant, no WebGL)
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/3 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 animate-aurora rounded-full opacity-60 blur-[110px]"
        style={{ background: "conic-gradient(from 90deg at 50% 50%, #8b5cf6, #22d3ee55, #6366f1, #8b5cf6)" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg)_75%)]" />
    </div>
  );
}
