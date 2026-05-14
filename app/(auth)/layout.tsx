export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.3fr]">

      {/* ── Left: E4G brand panel ── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{ backgroundColor: "oklch(0.225 0.09 243)" }}
      >
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.05]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Burnt-orange accent stripe */}
        <div className="h-1 w-full relative z-10" style={{ backgroundColor: "oklch(0.55 0.175 38)" }} />

        <div className="relative flex flex-col h-full p-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/e4g-logo.jpeg"
              alt="Evidence for Good"
              width={44}
              height={44}
              className="object-contain rounded-lg"
            />
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">
                Evidence for Good
              </p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">Grant Management</p>
            </div>
          </div>

          {/* Core message */}
          <div className="flex-1 flex flex-col justify-center mt-16 max-w-sm">
            <div className="flex items-center gap-2 mb-5">
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

            <h2 className="text-white text-[28px] font-bold leading-tight mb-5">
              Track every grant from&nbsp;discovery&nbsp;to&nbsp;award.
            </h2>

            <p className="text-white/65 text-sm leading-relaxed mb-8">
              Evidence for Good generates and uses rigorous research and data
              to help organisations across sub&#8209;Saharan Africa make
              evidence&#8209;based decisions that improve lives. This tracker
              keeps our funding pipeline — and the mission behind it — moving.
            </p>

            <div className="space-y-3">
              {[
                "AI‑powered opportunity discovery across 100+ sources",
                "Deadline tracking with automated team reminders",
                "Real‑time collaboration across the E4G team",
              ].map((feat) => (
                <div key={feat} className="flex items-start gap-3">
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
                  <p className="text-white/70 text-sm leading-relaxed">{feat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/25 text-xs mt-auto">
            Internal tool for Evidence for Good staff only.
          </p>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] animate-fade-up">

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
              <p className="text-sm font-bold leading-none">Evidence for Good</p>
              <p className="text-xs text-muted-foreground mt-0.5">Grant Management</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
