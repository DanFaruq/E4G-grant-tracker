export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.3fr]">

      {/* ── Left: animated brand panel ── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{ backgroundColor: "oklch(0.225 0.09 243)" }}
      >
        {/* ── Animated gradient orbs ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Amber orb — top right */}
          <div
            className="auth-orb-1 absolute -top-24 -right-24 size-[420px] rounded-full opacity-25 blur-[80px]"
            style={{ background: "radial-gradient(circle, oklch(0.75 0.18 55), oklch(0.55 0.175 38) 60%, transparent)" }}
          />
          {/* Indigo orb — bottom left */}
          <div
            className="auth-orb-2 absolute -bottom-32 -left-20 size-[380px] rounded-full opacity-20 blur-[90px]"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.20 280), oklch(0.45 0.18 260) 60%, transparent)" }}
          />
          {/* Green orb — centre */}
          <div
            className="auth-orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[280px] rounded-full opacity-10 blur-[70px]"
            style={{ background: "radial-gradient(circle, oklch(0.72 0.18 160), oklch(0.55 0.16 150) 60%, transparent)" }}
          />
        </div>

        {/* ── Animated moving mesh ── */}
        <div
          className="auth-mesh absolute pointer-events-none"
          style={{
            inset: "-60px",
            backgroundImage: [
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "60px 60px",
          }}
          aria-hidden="true"
        />

        {/* ── Burnt-orange accent stripe ── */}
        <div className="h-1 w-full relative z-10" style={{ backgroundColor: "oklch(0.55 0.175 38)" }} />

        <div className="relative flex flex-col h-full p-12 z-10">

          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-up">
            <img
              src="/e4g-logo.jpeg"
              alt="Evidence for Good"
              width={44}
              height={44}
              className="object-contain rounded-lg shadow-lg"
            />
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">
                E4G Team
              </p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">Evidence for Good</p>
            </div>
          </div>

          {/* Core message */}
          <div className="flex-1 flex flex-col justify-center mt-16 max-w-sm">
            <div className="flex items-center gap-2 mb-5 animate-fade-up stagger-2">
              <div
                className="h-0.5 w-8 rounded-full"
                style={{ backgroundColor: "oklch(0.55 0.175 38)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.72 0.155 38)" }}
              >
                Internal tool · E4G team
              </span>
            </div>

            <h2 className="text-white text-[28px] font-bold leading-tight mb-5 animate-fade-up stagger-3">
              Manage grants, people&nbsp;&amp;&nbsp;tasks — in one place.
            </h2>

            <p className="text-white/65 text-sm leading-relaxed mb-8 animate-fade-up stagger-4">
              Evidence for Good uses rigorous research and data to help organisations
              across sub&#8209;Saharan Africa make evidence&#8209;based decisions.
              This platform keeps our grants, stakeholder relationships, and team work coordinated.
            </p>

            <div className="space-y-3">
              {[
                { text: "Grant pipeline from discovery to award", cls: "stagger-5" },
                { text: "Stakeholder relationship tracking",       cls: "stagger-6" },
                { text: "Team tasks, events & activity feed",      cls: "stagger-7" },
              ].map(({ text, cls }) => (
                <div key={text} className={`flex items-start gap-3 animate-feature-in ${cls}`}>
                  <div
                    className="flex size-5 shrink-0 items-center justify-center rounded-full mt-0.5"
                    style={{
                      backgroundColor: "oklch(0.55 0.175 38 / 20%)",
                      boxShadow: "0 0 0 1px oklch(0.55 0.175 38 / 35%)",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path
                        d="M2 5l2.5 2.5 3.5-4"
                        stroke="oklch(0.72 0.155 38)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/25 text-xs mt-auto animate-fade-in stagger-9">
            Internal tool for Evidence for Good staff only.
          </p>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div
        className="dark flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, oklch(0.16 0.06 248) 0%, oklch(0.21 0.09 242) 100%)" }}
      >
        <div
          className="w-full max-w-[400px] relative z-10 animate-fade-up rounded-2xl p-7 sm:p-9"
          style={{
            background: "linear-gradient(145deg, oklch(0.26 0.07 244) 0%, oklch(0.21 0.06 250) 100%)",
            border: "1px solid oklch(1 0 0 / 11%)",
            color: "oklch(0.96 0.003 260)",
            boxShadow: [
              "inset 0 1px 0 oklch(1 0 0 / 10%)",
              "inset 0 -1px 0 oklch(0 0 0 / 25%)",
              "0 4px 16px oklch(0 0 0 / 35%)",
              "0 16px 40px oklch(0 0 0 / 28%)",
              "0 40px 80px oklch(0 0 0 / 20%)",
            ].join(", "),
          }}
        >

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img
              src="/e4g-logo.jpeg"
              alt="Evidence for Good"
              width={36}
              height={36}
              className="object-contain rounded-lg"
            />
            <div>
              <p className="text-sm font-bold leading-none">E4G Team</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evidence for Good</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
