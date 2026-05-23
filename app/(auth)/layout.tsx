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

        {/* ── Animated SVG node network ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.06" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
          {/* Animated connection lines */}
          <line x1="15%" y1="20%" x2="45%" y2="38%" stroke="white" strokeWidth="0.8"
            strokeDasharray="200" style={{ animation: "line-draw 2.2s ease-out 0.6s both" }} />
          <line x1="45%" y1="38%" x2="72%" y2="25%" stroke="white" strokeWidth="0.8"
            strokeDasharray="200" style={{ animation: "line-draw 2.2s ease-out 1.1s both" }} />
          <line x1="45%" y1="38%" x2="38%" y2="68%" stroke="white" strokeWidth="0.8"
            strokeDasharray="200" style={{ animation: "line-draw 2.2s ease-out 1.5s both" }} />
          <line x1="38%" y1="68%" x2="65%" y2="78%" stroke="white" strokeWidth="0.8"
            strokeDasharray="200" style={{ animation: "line-draw 2.2s ease-out 1.9s both" }} />
          <line x1="72%" y1="25%" x2="65%" y2="78%" stroke="white" strokeWidth="0.8"
            strokeDasharray="200" style={{ animation: "line-draw 2.2s ease-out 2.2s both" }} />
          {/* Nodes */}
          {([
            { cx: "45%", cy: "38%", r: 5,   color: "oklch(0.75 0.18 55)", delay: "0.4s" },
            { cx: "15%", cy: "20%", r: 3.5, color: "white",               delay: "0.7s" },
            { cx: "72%", cy: "25%", r: 3.5, color: "white",               delay: "1.0s" },
            { cx: "38%", cy: "68%", r: 3.5, color: "white",               delay: "1.3s" },
            { cx: "65%", cy: "78%", r: 3.5, color: "white",               delay: "1.6s" },
          ] as const).map((n, i) => (
            <circle
              key={i}
              cx={n.cx} cy={n.cy} r={n.r}
              fill={n.color}
              style={{ animation: `node-pulse 3s ease-in-out ${n.delay} infinite, fade-in 0.4s ease-out ${n.delay} both` }}
            />
          ))}
        </svg>

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
                E4G Team Management
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
      <div className="flex items-center justify-center p-8 bg-background relative overflow-hidden">
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        <div className="w-full max-w-[400px] relative z-10 animate-fade-up">

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
              <p className="text-sm font-bold leading-none">E4G Team Management</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evidence for Good</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
