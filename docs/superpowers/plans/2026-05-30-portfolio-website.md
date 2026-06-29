# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Dan Faruq's standalone interactive portfolio website — a Next.js 16 static site with dark/light themes, Framer Motion animations, interactive case study, and a Resend-powered contact form.

**Architecture:** Single-page Next.js 16 App Router site with static generation. All content lives in `lib/data.ts`. Interactive islands (`"use client"`) are isolated to the navbar, theme toggle, FAQ accordion, case study tabs/walkthrough, and contact form. The rest is pure Server Components.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · next-themes · Resend · JetBrains Mono + Inter (Google Fonts) · Vercel

---

## File Map

```
danfaruq-portfolio/
├── app/
│   ├── layout.tsx                # Root layout: fonts, ThemeProvider, metadata
│   ├── page.tsx                  # Assembles all sections (Server Component)
│   ├── globals.css               # Tailwind v4 + CSS variables + keyframes
│   └── api/contact/route.ts      # POST handler → Resend
├── components/
│   ├── nav/
│   │   └── Navbar.tsx            # Sticky nav, hamburger, theme toggle, scroll progress
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Projects.tsx          # Orchestrates AppMockup + TabPanel + Walkthrough
│   │   ├── Process.tsx
│   │   ├── Services.tsx
│   │   ├── Availability.tsx
│   │   ├── Stack.tsx
│   │   ├── Testimonial.tsx
│   │   ├── FAQ.tsx               # "use client" accordion
│   │   └── Contact.tsx           # "use client" split layout + form
│   ├── case-study/
│   │   ├── AppMockup.tsx         # Browser chrome + live E4G UI mockup
│   │   ├── TabPanel.tsx          # "use client" tabbed switcher
│   │   └── Walkthrough.tsx       # "use client" annotated screenshot carousel
│   └── ui/
│       ├── FadeIn.tsx            # "use client" Framer Motion scroll wrapper
│       ├── SectionLabel.tsx      # // label + title block
│       └── MobileCTA.tsx         # Fixed bottom bar (mobile only)
├── lib/
│   └── data.ts                   # All static content: tabs, walkthrough, services, FAQ
├── public/
│   └── screenshots/              # e4g-dashboard.png, e4g-mywork.png, e4g-grants.png, e4g-mobile.png
├── .env.local                    # RESEND_API_KEY
├── next.config.ts
└── package.json
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `danfaruq-portfolio/` (new repo, sibling to E4G-grant-tracker)
- Create: `package.json`, `next.config.ts`, `tsconfig.json`

- [ ] **Step 1: Initialise Next.js project**

```bash
cd "c:/Users/faruq/OneDrive/Documents/GitHub"
npx create-next-app@latest danfaruq-portfolio \
  --typescript --tailwind --app --no-src-dir \
  --no-eslint --import-alias "@/*"
cd danfaruq-portfolio
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion next-themes resend
npm install -D @types/node
```

- [ ] **Step 3: Replace next.config.ts**

```ts
// next.config.ts
import type { NextConfig } from "next"

const config: NextConfig = {
  output: "standalone",
}

export default config
```

- [ ] **Step 4: Create .env.local**

```bash
# .env.local
RESEND_API_KEY=re_placeholder
CONTACT_EMAIL=faruqdaniyan@gmail.com
```

- [ ] **Step 5: Init git and first commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 16 portfolio"
```

---

## Task 2: Global CSS + design tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css**

```css
/* app/globals.css */
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap");

:root {
  --bg: #ffffff;
  --bg2: #f8fafc;
  --bg3: #f1f5f9;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #0f172a;
  --text2: #475569;
  --text3: #94a3b8;
  --accent: #4f46e5;
  --accent2: #6366f1;
  --glow: rgba(79, 70, 229, 0.12);
  --grid: rgba(148, 163, 184, 0.06);
  --card: #ffffff;
  --tag-bg: #eef2ff;
  --tag: #4338ca;
  --mono: "JetBrains Mono", monospace;
}

[data-theme="dark"] {
  --bg: #080c12;
  --bg2: #0d1117;
  --bg3: #161b22;
  --surface: #0d1117;
  --border: #21262d;
  --text: #e6edf3;
  --text2: #8b949e;
  --text3: #484f58;
  --accent: #58a6ff;
  --accent2: #79c0ff;
  --glow: rgba(88, 166, 255, 0.1);
  --grid: rgba(88, 166, 255, 0.025);
  --card: #0d1117;
  --tag-bg: rgba(56, 139, 253, 0.08);
  --tag: #58a6ff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "Inter", sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow-x: hidden;
  transition: background 0.4s, color 0.4s;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

@keyframes scroll-down {
  0% { transform: translateY(-100%); opacity: 1; }
  100% { transform: translateY(200%); opacity: 0; }
}

.blink { animation: blink 1.1s infinite; }
.pulse-dot { animation: pulse-dot 2s infinite; }
.scroll-anim { animation: scroll-down 1.6s ease-in-out infinite; }
```

- [ ] **Step 2: Verify dev server starts cleanly**

```bash
npm run dev
# expect: ✓ Ready at http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore: global CSS tokens + keyframes"
```

---

## Task 3: Root layout + ThemeProvider

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/ui/ThemeProvider.tsx`

- [ ] **Step 1: Create ThemeProvider wrapper**

```tsx
// components/ui/ThemeProvider.tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 2: Update layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ui/ThemeProvider"
import { Navbar } from "@/components/nav/Navbar"
import { MobileCTA } from "@/components/ui/MobileCTA"

export const metadata: Metadata = {
  title: "Dan Faruq — Full-Stack Developer",
  description:
    "I build tools teams actually use. React, Next.js & Supabase specialist. Landing pages to complex web apps — designed, built, and shipped.",
  openGraph: {
    title: "Dan Faruq — Full-Stack Developer",
    description: "React · Next.js · Supabase. From landing pages to complex web apps.",
    url: "https://danfaruq.dev",
    siteName: "Dan Faruq",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <MobileCTA />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx components/ui/ThemeProvider.tsx
git commit -m "chore: root layout + next-themes provider"
```

---

## Task 4: Navbar

**Files:**
- Create: `components/nav/Navbar.tsx`

- [ ] **Step 1: Create Navbar**

```tsx
// components/nav/Navbar.tsx
"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

const LINKS = ["work", "services", "process", "contact"]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      const el = document.documentElement
      setScrollPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isDark = theme === "dark"

  return (
    <>
      {/* Scroll progress */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[999] transition-all"
        style={{
          width: `${scrollPct}%`,
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
        }}
      />

      {/* Nav bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] border-b"
        style={{
          background: "var(--nav-bg, rgba(8,12,18,0.88))",
          borderColor: "var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-[1100px] mx-auto flex items-center h-[60px] px-6 gap-2">
          {/* Logo */}
          <div
            className="flex items-center gap-1 mr-auto text-[14px] font-bold tracking-tight"
            style={{ fontFamily: "var(--mono)", color: "var(--text)" }}
          >
            <span style={{ color: "var(--accent)", fontSize: 17 }}>{`{`}</span>
            danfaruq
            <span style={{ color: "var(--accent)", fontSize: 17 }}>{`}`}</span>
            <span
              className="blink inline-block w-[2px] h-[14px] ml-[2px] rounded-sm"
              style={{ background: "var(--accent)", verticalAlign: "middle" }}
            />
          </div>

          {/* Available pill — desktop */}
          <div
            className="hidden md:flex items-center gap-[5px] text-[10px] font-semibold px-[10px] py-1 rounded-full mr-2"
            style={{
              fontFamily: "var(--mono)",
              color: "#22c55e",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span className="pulse-dot inline-block w-[6px] h-[6px] rounded-full bg-green-500" />
            available
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex gap-[2px]">
            {LINKS.map((link) => (
              <a
                key={link}
                href={`#${link}`}
                className="nav-link text-[12px] font-medium px-3 py-[6px] rounded-md transition-colors cursor-pointer"
                style={{ fontFamily: "var(--mono)", color: "var(--text2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text2)")}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Hire me CTA — desktop */}
          <a
            href="#contact"
            className="hidden md:block text-[12px] font-bold px-[18px] py-2 rounded-lg text-white ml-1 transition-all hover:-translate-y-px"
            style={{
              background: "var(--accent)",
              fontFamily: "var(--mono)",
              boxShadow: "0 0 20px var(--glow)",
            }}
          >
            $ hire_me →
          </a>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-[34px] h-[34px] rounded-lg flex items-center justify-content-center ml-2 transition-transform hover:rotate-12 hover:scale-110"
              style={{ border: "1px solid var(--border)", background: "var(--bg3)" }}
              aria-label="Toggle theme"
            >
              <span className="w-full text-center text-sm">{isDark ? "☀️" : "🌙"}</span>
            </button>
          )}

          {/* Hamburger — mobile */}
          <button
            className="flex md:hidden flex-col gap-[5px] p-[6px] ml-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-[20px] h-[2px] rounded-sm transition-all"
                style={{ background: "var(--text)" }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[60px] z-[99] flex flex-col items-center justify-center gap-8"
          style={{
            background: "var(--nav-bg, rgba(8,12,18,0.95))",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {LINKS.map((link) => (
            <a
              key={link}
              href={`#${link}`}
              onClick={() => setMenuOpen(false)}
              className="text-[20px] font-medium px-6 py-3 transition-colors"
              style={{ fontFamily: "var(--mono)", color: "var(--text2)" }}
            >
              {link}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="text-[16px] font-bold px-8 py-[14px] rounded-xl text-white"
            style={{ background: "var(--accent)", fontFamily: "var(--mono)" }}
          >
            $ hire_me →
          </a>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Add MobileCTA placeholder (needed for layout to compile)**

```tsx
// components/ui/MobileCTA.tsx
export function MobileCTA() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] p-3"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
      <a
        href="#contact"
        className="block w-full text-center text-[14px] font-bold py-[14px] rounded-xl text-white"
        style={{ background: "var(--accent)", fontFamily: "var(--mono)" }}
      >
        Book a free call →
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Verify nav renders**

```bash
npm run dev
# open localhost:3000 — nav visible, theme toggle works, hamburger visible on narrow viewport
```

- [ ] **Step 4: Commit**

```bash
git add components/nav/Navbar.tsx components/ui/MobileCTA.tsx
git commit -m "feat: navbar with scroll progress, theme toggle, mobile menu"
```

---

## Task 5: FadeIn wrapper + SectionLabel

**Files:**
- Create: `components/ui/FadeIn.tsx`
- Create: `components/ui/SectionLabel.tsx`

- [ ] **Step 1: FadeIn**

```tsx
// components/ui/FadeIn.tsx
"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: SectionLabel**

```tsx
// components/ui/SectionLabel.tsx
export function SectionLabel({ label, title }: { label: string; title: string }) {
  return (
    <>
      <p
        className="text-[10px] font-bold uppercase tracking-[2px] mb-[10px]"
        style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}
      >
        {label}
      </p>
      <h2
        className="font-black tracking-tight mb-10"
        style={{
          fontSize: "clamp(22px, 4vw, 34px)",
          letterSpacing: "-1px",
          color: "var(--text)",
        }}
      >
        {title}
      </h2>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/FadeIn.tsx components/ui/SectionLabel.tsx
git commit -m "feat: FadeIn scroll wrapper + SectionLabel"
```

---

## Task 6: Content data layer

**Files:**
- Create: `lib/data.ts`

- [ ] **Step 1: Create data.ts**

```ts
// lib/data.ts

export const TAB_DATA: Record<string, string> = {
  overview:
    "E4G Team needed a single platform to track grants, assign tasks, and manage stakeholder relationships. I built a purpose-built system in 4 weeks that now runs their entire grant operation.",
  problem:
    "The team was managing 20+ grants across spreadsheets and email threads. Deadlines were missed, ownership was unclear, and there was no single source of truth for the team.",
  build:
    "Built with Next.js 16 App Router + Server Actions, Supabase for auth, Postgres + RLS, and real-time subscriptions. Service Worker handles Web Push notifications. Deployed on Vercel with daily cron jobs.",
  tech_stack:
    "React 19 · Next.js 16 · TypeScript · Supabase (Postgres + RLS + Realtime) · Tailwind CSS v4 · Framer Motion · shadcn/ui · Vercel · Web Push (VAPID) · Zod · React Hook Form · Resend",
  results:
    "The team went from spreadsheets to a fully live production platform. Every member has a personal My Work dashboard. Push notifications track deadlines. Admin can view any team member's workload in one click.",
  live_demo: "Opening live app — e4g-grant-tracker.vercel.app",
}

export const WALKTHROUGH_SCREENS = [
  {
    label: "Dashboard",
    annotation: "← Grant overview",
    description: "Real-time KPIs — overdue, due today, in progress, awarded",
    image: "/screenshots/e4g-dashboard.png",
  },
  {
    label: "My Work",
    annotation: "← Personal dashboard",
    description: "Per-user view of assigned tasks, events, and grants",
    image: "/screenshots/e4g-mywork.png",
  },
  {
    label: "Grants",
    annotation: "← Full grant list",
    description: "Kanban or list view with stage filters and deadline tracking",
    image: "/screenshots/e4g-grants.png",
  },
  {
    label: "Mobile",
    annotation: "← PWA-ready",
    description: "Fully responsive with mobile tab bar and push notifications",
    image: "/screenshots/e4g-mobile.png",
  },
]

export const SERVICES = [
  {
    icon: "🚀",
    title: "Landing Pages",
    desc: "High-converting marketing pages, product launches, and startup landing pages that look great on every screen.",
    note: "→ from idea to live in days",
  },
  {
    icon: "🌐",
    title: "Business Websites",
    desc: "Portfolios, agency sites, NGO websites, and service pages — fast, SEO-friendly, and easy to update.",
    note: "→ Next.js or custom HTML/CSS",
  },
  {
    icon: "⚡",
    title: "Web Applications",
    desc: "Full-stack apps with auth, database, real-time data, file uploads, and role-based access control.",
    note: "→ React · Next.js · Supabase",
  },
  {
    icon: "🛠",
    title: "Internal Tools",
    desc: "Custom dashboards, admin panels, and workflow apps that replace spreadsheets and cut manual work.",
    note: "→ your team's new favourite tool",
  },
  {
    icon: "📊",
    title: "Dashboards & Reports",
    desc: "Live data visualisation with filters, role-based views, and charts that update in real time.",
    note: "→ connected to your data source",
  },
  {
    icon: "🎨",
    title: "UI/UX Design + Build",
    desc: "I design the interface and build it — no separate designer needed. Clean, usable, and on-brand.",
    note: "→ Figma → code, or design-as-I-build",
  },
]

export const STACK = [
  { label: "React 19", highlight: true },
  { label: "Next.js 16", highlight: true },
  { label: "TypeScript", highlight: true },
  { label: "Supabase" },
  { label: "PostgreSQL" },
  { label: "Tailwind CSS v4" },
  { label: "Framer Motion" },
  { label: "shadcn/ui" },
  { label: "Zod" },
  { label: "Vercel" },
  { label: "Web Push" },
  { label: "Resend" },
  { label: "HTML / CSS" },
  { label: "Node.js" },
]

export const FAQ_ITEMS = [
  {
    q: "How long does a project take?",
    a: "Landing pages and simple sites: 3–7 days. Internal tools and web apps: 3–6 weeks. Complex platforms: 8–12 weeks. I give you a fixed timeline after our first call.",
  },
  {
    q: "Do you do design too, or just development?",
    a: "Both. I design the interface and build it. You don't need a separate designer — I work from your brief, a rough sketch, or from scratch. For larger projects I use Figma to align before building.",
  },
  {
    q: "What do you need from me to get started?",
    a: "A description of the problem you want solved, who uses it, and any existing tools or data to work with. I handle everything else — design, architecture, build, and deployment.",
  },
  {
    q: "Do you do ongoing maintenance?",
    a: "Yes. After the 2-week post-launch support period I offer monthly retainers for ongoing development and maintenance. Rates depend on scope.",
  },
  {
    q: "I'm not technical — will I understand what's being built?",
    a: "Absolutely. I write in plain English, send weekly Loom updates, and give you a live preview link from day one. You stay in the loop without needing to understand code.",
  },
]

export const PROCESS_STEPS = [
  { n: "01", icon: "🔍", title: "Discover", desc: "I ask the hard questions first — what problem are we solving, who uses it, what does success look like?" },
  { n: "02", icon: "📐", title: "Design", desc: "Architecture before code. Data model, auth flow, and component structure agreed before a line is written." },
  { n: "03", icon: "⚡", title: "Build", desc: "Weekly check-ins and live preview links throughout. You see progress, not just a final reveal." },
  { n: "04", icon: "🚀", title: "Ship", desc: "Deployed, tested, and documented. I stay on for 2 weeks post-launch to catch anything unexpected." },
]
```

- [ ] **Step 2: Commit**

```bash
git add lib/data.ts
git commit -m "feat: content data layer"
```

---

## Task 7: Hero section

**Files:**
- Create: `components/sections/Hero.tsx`

- [ ] **Step 1: Create Hero**

```tsx
// components/sections/Hero.tsx
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const STATS = [
  { n: "1+", l: "Live clients" },
  { n: "4wk", l: "Avg delivery" },
  { n: "100%", l: "Ships to prod" },
  { n: "remote", l: "Works globally" },
]

export function Hero() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-[100px] pb-[80px] overflow-hidden z-[1]"
      style={{ background: "var(--hero-bg, var(--bg))" }}
    >
      {/* Available badge */}
      <div
        className="inline-flex items-center gap-2 border rounded-full text-[11px] font-semibold px-4 py-[6px] mb-7"
        style={{
          fontFamily: "var(--mono)",
          color: "var(--text2)",
          background: "var(--bg2)",
          borderColor: "var(--border)",
        }}
      >
        <span className="pulse-dot inline-block w-[6px] h-[6px] rounded-full bg-green-500" />
        available for new projects
      </div>

      {/* Terminal line — dark only */}
      {mounted && theme === "dark" && (
        <div
          className="flex items-center justify-center gap-1 text-[13px] mb-5"
          style={{ fontFamily: "var(--mono)", color: "#3fb950" }}
        >
          <span style={{ color: "var(--accent)" }}>❯</span>
          <span>
            danfaruq.build(<span style={{ color: "#a5d6ff" }}>&quot;your_idea&quot;</span>)
          </span>
          <span
            className="blink inline-block w-[8px] h-[15px] rounded-sm"
            style={{ background: "#3fb950", verticalAlign: "middle" }}
          />
        </div>
      )}

      {/* H1 */}
      <h1
        className="font-black max-w-[820px] mx-auto"
        style={{
          fontSize: "clamp(34px, 7vw, 82px)",
          lineHeight: 1.0,
          letterSpacing: "clamp(-1.5px, -0.04em, -3px)",
          color: "var(--text)",
        }}
      >
        I build things
        <br />
        <span
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          people actually use.
        </span>
      </h1>

      {/* Subheading */}
      <p
        className="max-w-[520px] mx-auto mt-5 mb-8"
        style={{
          fontSize: "clamp(13px, 2vw, 16px)",
          color: "var(--text2)",
          lineHeight: 1.75,
        }}
      >
        Full-stack developer specialising in React, Next.js & Supabase. From landing pages to
        complex web apps — I design, build, and ship products that reach production and stay there.
      </p>

      {/* CTAs */}
      <div className="flex gap-3 justify-center flex-wrap">
        <a
          href="#contact"
          className="font-bold px-[26px] py-[13px] rounded-[10px] text-white transition-all hover:-translate-y-[3px]"
          style={{
            fontSize: 13,
            background: "var(--accent)",
            fontFamily: "var(--mono)",
            boxShadow: "0 0 24px var(--glow)",
          }}
        >
          Book a free call →
        </a>
        <a
          href="#work"
          className="font-semibold px-[26px] py-[13px] rounded-[10px] transition-all hover:-translate-y-[3px] hover:border-[var(--accent)]"
          style={{
            fontSize: 13,
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text2)",
            fontFamily: "var(--mono)",
          }}
        >
          See my work ↓
        </a>
      </div>

      {/* Stats strip */}
      <div
        className="flex flex-wrap border rounded-xl mt-10 overflow-hidden"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.l}
            className="flex-1 min-w-[110px] px-5 py-4 text-center"
            style={{ borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div
              className="font-black tracking-tight"
              style={{ fontSize: 22, fontFamily: "var(--mono)", color: "var(--text)" }}
            >
              {s.n}
            </div>
            <div
              className="text-[9px] font-semibold uppercase tracking-[0.5px] mt-[2px]"
              style={{ color: "var(--text3)" }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[6px] text-[10px]"
        style={{ color: "var(--text3)", fontFamily: "var(--mono)" }}
      >
        <div
          className="w-[4px] h-[28px] rounded overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="scroll-anim w-full h-[10px] rounded"
            style={{ background: "var(--accent)" }}
          />
        </div>
        scroll
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/Hero.tsx
git commit -m "feat: hero section"
```

---

## Task 8: AppMockup component

**Files:**
- Create: `components/case-study/AppMockup.tsx`

- [ ] **Step 1: Create AppMockup**

```tsx
// components/case-study/AppMockup.tsx
export function AppMockup() {
  return (
    <div
      className="relative pb-0 pt-5 px-5"
      style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Permission badge */}
      <div
        className="absolute top-3 right-3 text-[9px] font-semibold px-[10px] py-1 rounded-full z-10"
        style={{
          fontFamily: "var(--mono)",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e",
        }}
      >
        ✓ shared with client permission
      </div>

      {/* Browser chrome */}
      <div
        className="rounded-t-[10px] overflow-hidden shadow-lg border border-b-0"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Title bar */}
        <div
          className="h-8 flex items-center gap-[5px] px-3"
          style={{ background: "var(--bg3)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="w-[10px] h-[10px] rounded-full bg-red-400" />
          <div className="w-[10px] h-[10px] rounded-full bg-yellow-400" />
          <div className="w-[10px] h-[10px] rounded-full bg-green-400" />
          <div
            className="flex-1 mx-2 h-[18px] rounded flex items-center px-2"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              fontFamily: "var(--mono)",
              fontSize: 9,
              color: "var(--text3)",
            }}
          >
            e4g-grant-tracker.vercel.app/dashboard
          </div>
        </div>

        {/* App body */}
        <div className="flex" style={{ height: 200, background: "var(--bg)" }}>
          {/* Sidebar — hidden on mobile */}
          <div
            className="hidden sm:flex w-[52px] flex-col items-center py-[10px] gap-2 shrink-0"
            style={{ background: "#1e293b", borderRight: "1px solid #334155" }}
          >
            {["📊", "📄", "✅", "👥", "🔔"].map((icon, i) => (
              <div
                key={icon}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px]"
                style={i === 0 ? { background: "#4f46e5" } : { opacity: 0.4 }}
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div
            className="flex-1 flex flex-col gap-2 p-3 overflow-hidden"
            style={{ background: "var(--bg2)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <div
                  className="font-extrabold text-[13px]"
                  style={{ color: "var(--text)" }}
                >
                  Dashboard
                </div>
                <div className="text-[9px]" style={{ color: "var(--text3)" }}>
                  E4G Team · 5 active grants
                </div>
              </div>
              <div
                className="text-[8px] font-bold px-2 py-1 rounded-[5px] text-white"
                style={{ background: "#4f46e5" }}
              >
                + New Grant
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[6px]">
              {[
                { label: "OVERDUE", n: "2", color: "#ef4444", bg: "rgba(239,68,68,0.06)" },
                { label: "DUE TODAY", n: "1", color: "#f59e0b", bg: "rgba(245,158,11,0.06)" },
                { label: "IN PROGRESS", n: "3", color: "#4f46e5", bg: "rgba(79,70,229,0.06)" },
                { label: "AWARDED", n: "4", color: "#22c55e", bg: "rgba(34,197,94,0.06)" },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-lg p-[7px]"
                  style={{ background: k.bg, border: `1px solid ${k.color}22` }}
                >
                  <div
                    className="text-[7px] font-bold uppercase tracking-[0.5px]"
                    style={{ color: k.color }}
                  >
                    {k.label}
                  </div>
                  <div
                    className="text-[16px] font-black"
                    style={{ fontFamily: "var(--mono)", color: k.color }}
                  >
                    {k.n}
                  </div>
                </div>
              ))}
            </div>

            {/* Task rows */}
            <div className="flex flex-col gap-[6px]">
              {[
                {
                  title: "Submit Adult Literacy proposal",
                  status: "In progress",
                  statusColor: "#d97706",
                  statusBg: "rgba(245,158,11,0.1)",
                  priority: "Urgent",
                  priorityColor: "#dc2626",
                  priorityBg: "rgba(239,68,68,0.08)",
                },
                {
                  title: "Collect impact data from 2024 cohort",
                  status: "To do",
                  statusColor: "#64748b",
                  statusBg: "#f1f5f9",
                  priority: "High",
                  priorityColor: "#ea580c",
                  priorityBg: "rgba(234,88,12,0.08)",
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className="flex items-center gap-[6px] rounded-md px-2 py-[6px] flex-wrap"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="w-[10px] h-[10px] rounded-full shrink-0"
                    style={{ border: "1.5px solid #94a3b8" }}
                  />
                  <div
                    className="text-[9px] font-semibold flex-1 min-w-[80px] truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {t.title}
                  </div>
                  <span
                    className="text-[7px] font-bold px-[5px] py-[2px] rounded-full shrink-0"
                    style={{ background: t.statusBg, color: t.statusColor }}
                  >
                    {t.status}
                  </span>
                  <span
                    className="text-[7px] font-bold px-[5px] py-[2px] rounded-full shrink-0"
                    style={{ background: t.priorityBg, color: t.priorityColor }}
                  >
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/case-study/AppMockup.tsx
git commit -m "feat: E4G app mockup component"
```

---

## Task 9: TabPanel + Walkthrough

**Files:**
- Create: `components/case-study/TabPanel.tsx`
- Create: `components/case-study/Walkthrough.tsx`

- [ ] **Step 1: TabPanel**

```tsx
// components/case-study/TabPanel.tsx
"use client"

import { useState } from "react"
import { TAB_DATA } from "@/lib/data"

const TABS = ["overview", "problem", "build", "tech_stack", "results", "live_demo"]

export function TabPanel() {
  const [active, setActive] = useState("overview")

  return (
    <div
      className="rounded-[10px] overflow-hidden mb-[14px]"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Tab bar */}
      <div
        className="flex overflow-x-auto"
        style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="px-[13px] py-[9px] text-[11px] font-semibold whitespace-nowrap transition-all"
            style={{
              fontFamily: "var(--mono)",
              color: active === tab ? "var(--accent)" : "var(--text3)",
              background: active === tab ? "var(--surface)" : "transparent",
              borderBottom: active === tab ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="p-4 text-[12px] min-h-[70px]"
        style={{ background: "var(--surface)", color: "var(--text2)", lineHeight: 1.75 }}
      >
        {TAB_DATA[active]}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Walkthrough**

```tsx
// components/case-study/Walkthrough.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { WALKTHROUGH_SCREENS } from "@/lib/data"

export function Walkthrough() {
  const [idx, setIdx] = useState(0)
  const screen = WALKTHROUGH_SCREENS[idx]

  return (
    <div
      className="rounded-[10px] p-[14px] mb-[14px]"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[1px] mb-[10px]"
        style={{ color: "var(--text3)", fontFamily: "var(--mono)" }}
      >
        app_walkthrough · {idx + 1}/{WALKTHROUGH_SCREENS.length}
      </div>

      {/* Screen */}
      <div
        className="rounded-lg mb-[10px] relative overflow-hidden flex items-center justify-center text-[11px]"
        style={{
          background: "var(--bg3)",
          minHeight: 140,
          color: "var(--text3)",
          border: "1px solid var(--border)",
        }}
      >
        {screen.image ? (
          <Image
            src={screen.image}
            alt={screen.label}
            fill
            className="object-cover"
            onError={() => {}} // graceful fallback
          />
        ) : (
          <span>{screen.label} — screenshot goes here</span>
        )}
        <div
          className="absolute top-2 right-2 text-[9px] font-semibold px-2 py-1 rounded-md text-white z-10"
          style={{ background: "var(--accent)", fontFamily: "var(--mono)" }}
        >
          {screen.annotation}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-[5px]">
          {WALKTHROUGH_SCREENS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-[7px] h-[7px] rounded-full transition-colors"
              style={{ background: i === idx ? "var(--accent)" : "var(--border)" }}
            />
          ))}
        </div>
        <div
          className="text-[11px] flex-1 mx-3 truncate"
          style={{ color: "var(--text2)" }}
        >
          {screen.description}
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="px-3 py-1 rounded-md text-[11px] transition-opacity disabled:opacity-40"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              fontFamily: "var(--mono)",
            }}
            disabled={idx === 0}
          >
            ← prev
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(WALKTHROUGH_SCREENS.length - 1, i + 1))}
            className="px-3 py-1 rounded-md text-[11px] transition-opacity disabled:opacity-40 text-white"
            style={{
              background: "var(--accent)",
              fontFamily: "var(--mono)",
            }}
            disabled={idx === WALKTHROUGH_SCREENS.length - 1}
          >
            next →
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/case-study/TabPanel.tsx components/case-study/Walkthrough.tsx
git commit -m "feat: case study TabPanel + Walkthrough carousel"
```

---

## Task 10: Projects section

**Files:**
- Create: `components/sections/Projects.tsx`

- [ ] **Step 1: Create Projects**

```tsx
// components/sections/Projects.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { AppMockup } from "@/components/case-study/AppMockup"
import { TabPanel } from "@/components/case-study/TabPanel"
import { Walkthrough } from "@/components/case-study/Walkthrough"

export function Projects() {
  return (
    <section
      id="work"
      className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]"
    >
      <FadeIn>
        <SectionLabel label="// work" title="Selected Projects" />
      </FadeIn>

      {/* E4G Case study card */}
      <FadeIn delay={0.1}>
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 0 0 0 var(--accent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)"
            e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px var(--accent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <AppMockup />

          <div className="p-6">
            {/* Tags */}
            <div className="flex gap-[6px] flex-wrap mb-3">
              {["NGO", "Grant Management", "Full-Stack"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold px-[10px] py-[3px] rounded-full"
                  style={{
                    background: "var(--tag-bg)",
                    color: "var(--tag)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {t}
                </span>
              ))}
              <span
                className="text-[10px] font-bold px-[10px] py-[3px] rounded-full"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#22c55e",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                ● Live
              </span>
            </div>

            <h3
              className="font-extrabold mb-[6px]"
              style={{
                fontSize: "clamp(15px, 2.5vw, 20px)",
                letterSpacing: "-0.5px",
                color: "var(--text)",
              }}
            >
              E4G Team — Grant Tracker
            </h3>

            <p
              className="text-[13px] mb-5"
              style={{ color: "var(--text2)", lineHeight: 1.75 }}
            >
              A full-stack grant management platform replacing spreadsheets for an NGO. Tracks
              grants end-to-end with team tasks, real-time updates, push notifications, and a
              personal dashboard for every team member.
            </p>

            {/* Terminal block — dark mode only */}
            <div
              className="hidden dark:block rounded-[10px] p-5 mb-5 text-[12px] leading-[1.9]"
              style={{
                background: "#080c12",
                border: "1px solid #21262d",
                fontFamily: "var(--mono)",
              }}
            >
              <div style={{ color: "#484f58" }}>{"// project.json"}</div>
              <div>
                <span style={{ color: "#79c0ff" }}>client</span>
                {": "}
                <span style={{ color: "#a5d6ff" }}>&quot;E4G Team&quot;</span>,
              </div>
              <div>
                <span style={{ color: "#79c0ff" }}>stack</span>
                {": ["}
                <span style={{ color: "#a5d6ff" }}>&quot;Next.js 16&quot;</span>
                {", "}
                <span style={{ color: "#a5d6ff" }}>&quot;Supabase&quot;</span>
                {", "}
                <span style={{ color: "#a5d6ff" }}>&quot;React 19&quot;</span>
                {"],"}
              </div>
              <div>
                <span style={{ color: "#79c0ff" }}>shipped_in</span>
                {": "}
                <span style={{ color: "#f2cc60" }}>4</span>
                <span style={{ color: "#484f58" }}>{" // weeks"}</span>,
              </div>
              <div>
                <span style={{ color: "#79c0ff" }}>status</span>
                {": "}
                <span style={{ color: "#3fb950" }}>live</span>,
              </div>
              <div>
                <span style={{ color: "#79c0ff" }}>impact</span>
                {": "}
                <span style={{ color: "#a5d6ff" }}>&quot;team fully off spreadsheets&quot;</span>
              </div>
            </div>

            <TabPanel />
            <Walkthrough />

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <a
                href="#contact"
                className="font-bold px-[18px] py-[10px] rounded-lg text-white text-[12px] transition-all hover:-translate-y-[2px]"
                style={{ background: "var(--accent)", fontFamily: "var(--mono)" }}
              >
                Explore case study →
              </a>
              <a
                href="https://e4g-grant-tracker.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold px-[18px] py-[10px] rounded-lg text-[12px] transition-all hover:-translate-y-[2px]"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text2)",
                  fontFamily: "var(--mono)",
                }}
              >
                View live app ↗
              </a>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Coming soon */}
      <FadeIn delay={0.2}>
        <div
          className="flex items-center gap-4 rounded-2xl p-6 mt-3 opacity-60"
          style={{ background: "var(--card)", border: "1px dashed var(--border)" }}
        >
          <div
            className="w-[46px] h-[46px] rounded-xl flex items-center justify-center text-[22px] shrink-0"
            style={{ background: "var(--bg3)" }}
          >
            ⚙️
          </div>
          <div>
            <div className="font-bold text-[13px]" style={{ color: "var(--text)" }}>
              Next Project
            </div>
            <div
              className="text-[11px] mt-[2px]"
              style={{ color: "var(--text3)", fontFamily: "var(--mono)" }}
            >
              {"// in architecture phase · coming soon"}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/Projects.tsx
git commit -m "feat: projects section with case study card"
```

---

## Task 11: Process + Services + Stack sections

**Files:**
- Create: `components/sections/Process.tsx`
- Create: `components/sections/Services.tsx`
- Create: `components/sections/Stack.tsx`

- [ ] **Step 1: Process**

```tsx
// components/sections/Process.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { PROCESS_STEPS } from "@/lib/data"

export function Process() {
  return (
    <section id="process" className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]">
      <FadeIn><SectionLabel label="// how_i_work" title="My Process" /></FadeIn>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PROCESS_STEPS.map((s, i) => (
          <FadeIn key={s.n} delay={i * 0.08}>
            <div
              className="relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-[3px] overflow-hidden group"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="text-[11px] font-bold mb-[10px]"
                style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}
              >
                {s.n}
              </div>
              <div className="text-[22px] mb-2">{s.icon}</div>
              <div className="font-bold text-[13px] mb-1" style={{ color: "var(--text)" }}>
                {s.title}
              </div>
              <div className="text-[11px] leading-[1.6]" style={{ color: "var(--text2)" }}>
                {s.desc}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Services**

```tsx
// components/sections/Services.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { SERVICES } from "@/lib/data"

export function Services() {
  return (
    <section id="services" className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]">
      <FadeIn><SectionLabel label="// services" title="What I Build" /></FadeIn>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERVICES.map((s, i) => (
          <FadeIn key={s.title} delay={i * 0.06}>
            <div
              className="rounded-xl p-5 transition-all duration-300 hover:-translate-y-[3px] h-full"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)"
                e.currentTarget.style.background = "var(--glow)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.background = "var(--card)"
              }}
            >
              <div className="text-[24px] mb-[10px]">{s.icon}</div>
              <div className="font-bold text-[13px] mb-1" style={{ color: "var(--text)" }}>
                {s.title}
              </div>
              <div className="text-[11px] leading-[1.6] mb-[6px]" style={{ color: "var(--text2)" }}>
                {s.desc}
              </div>
              <div
                className="text-[10px] font-semibold mt-1"
                style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}
              >
                {s.note}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Stack**

```tsx
// components/sections/Stack.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { STACK } from "@/lib/data"

export function Stack() {
  return (
    <div
      className="relative z-[1] py-10 px-6"
      style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-[960px] mx-auto">
        <FadeIn>
          <p
            className="text-[10px] font-bold uppercase tracking-[2px] mb-4"
            style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}
          >
            // tech_stack
          </p>
          <div className="flex flex-wrap gap-2">
            {STACK.map((pill) => (
              <span
                key={pill.label}
                className="rounded-lg px-[14px] py-2 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-[2px] cursor-default"
                style={{
                  background: "var(--surface)",
                  border: pill.highlight ? "1px solid var(--accent)" : "1px solid var(--border)",
                  color: pill.highlight ? "var(--accent)" : "var(--text2)",
                  fontFamily: "var(--mono)",
                }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/sections/Process.tsx components/sections/Services.tsx components/sections/Stack.tsx
git commit -m "feat: process, services, stack sections"
```

---

## Task 12: Availability + Testimonial sections

**Files:**
- Create: `components/sections/Availability.tsx`
- Create: `components/sections/Testimonial.tsx`

- [ ] **Step 1: Availability**

```tsx
// components/sections/Availability.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"

const POINTS = [
  "Async-first workflow",
  "Weekly progress updates",
  "Fixed-scope or retainer",
  "2-week post-launch support",
]

export function Availability() {
  return (
    <section className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]">
      <FadeIn><SectionLabel label="// availability" title="Let's Work Together" /></FadeIn>
      <FadeIn delay={0.1}>
        <div
          className="rounded-2xl p-7 flex gap-6 flex-wrap items-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex-1 min-w-[180px]">
            <div className="text-[18px] font-extrabold mb-2" style={{ color: "var(--text)" }}>
              Open for projects.
            </div>
            <div className="text-[12px] leading-[1.75]" style={{ color: "var(--text2)" }}>
              Works{" "}
              <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                fully remote
              </span>{" "}
              with clients worldwide.
              <br />
              Reply time:{" "}
              <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                within 24 hours
              </span>
              .
              <br />
              Projects start within{" "}
              <span style={{ color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                1–2 weeks
              </span>{" "}
              of agreement.
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[150px]">
            {POINTS.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 text-[11px]"
                style={{ color: "var(--text2)", fontFamily: "var(--mono)" }}
              >
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>→</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
```

- [ ] **Step 2: Testimonial**

```tsx
// components/sections/Testimonial.tsx
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"

export function Testimonial() {
  return (
    <section className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]">
      <FadeIn><SectionLabel label="// client_words" title="What They Say" /></FadeIn>
      <FadeIn delay={0.1}>
        <div
          className="rounded-2xl p-8 relative"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="absolute top-4 left-6 text-[72px] leading-[0.8] opacity-20"
            style={{ color: "var(--accent)", fontFamily: "Georgia, serif" }}
          >
            &ldquo;
          </div>
          <p
            className="pt-7 italic leading-[1.8]"
            style={{ fontSize: "clamp(13px, 2vw, 16px)", color: "var(--text2)" }}
          >
            [Testimonial from E4G Team — to be added after outreach. A genuine quote here closes
            deals before the first call.]
          </p>
          <div className="flex items-center gap-3 mt-5">
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[13px] font-extrabold text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              }}
            >
              E4
            </div>
            <div>
              <div className="font-bold text-[13px]" style={{ color: "var(--text)" }}>
                E4G Team
              </div>
              <div className="text-[11px]" style={{ color: "var(--text3)" }}>
                Evidence for Good · NGO
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/sections/Availability.tsx components/sections/Testimonial.tsx
git commit -m "feat: availability + testimonial sections"
```

---

## Task 13: FAQ section

**Files:**
- Create: `components/sections/FAQ.tsx`

- [ ] **Step 1: Create FAQ accordion**

```tsx
// components/sections/FAQ.tsx
"use client"

import { useState } from "react"
import { FadeIn } from "@/components/ui/FadeIn"
import { SectionLabel } from "@/components/ui/SectionLabel"
import { FAQ_ITEMS } from "@/lib/data"

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 px-6 max-w-[960px] mx-auto relative z-[1]">
      <FadeIn><SectionLabel label="// faq" title="Common Questions" /></FadeIn>
      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((item, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <div
              className="rounded-[10px] overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <button
                className="w-full flex justify-between items-center px-5 py-4 text-left transition-colors text-[13px] font-bold"
                style={{ color: open === i ? "var(--accent)" : "var(--text)" }}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <span
                  className="text-[16px] transition-transform duration-300 ml-4 shrink-0"
                  style={{
                    color: "var(--text3)",
                    fontFamily: "var(--mono)",
                    transform: open === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div
                  className="px-5 pb-4 text-[12px] leading-[1.75]"
                  style={{ color: "var(--text2)" }}
                >
                  {item.a}
                </div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/FAQ.tsx
git commit -m "feat: FAQ accordion section"
```

---

## Task 14: Contact section

**Files:**
- Create: `components/sections/Contact.tsx`

- [ ] **Step 1: Create Contact**

```tsx
// components/sections/Contact.tsx
"use client"

import { useState } from "react"

const SOCIAL = [
  {
    label: "GitHub",
    href: "https://github.com/DanFaruq",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    label: "Fiverr",
    href: "https://fiverr.com",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 0H1C.45 0 0 .45 0 1v22c0 .55.45 1 1 1h22c.55 0 1-.45 1-1V1c0-.55-.45-1-1-1zM9.61 15.67c0 1.56-1.27 2.83-2.83 2.83S3.95 17.23 3.95 15.67s1.27-2.83 2.83-2.83 2.83 1.27 2.83 2.83zm9.89-8.12h-3.09v1.93h3.09v2.58h-3.09v6.44h-2.58V7.96h-.99V5.38h.99v-.52C13.83 3.3 14.96 2 17.03 2c.82 0 1.54.12 2.47.35v2.52c-.67-.22-1.18-.32-1.67-.32-.81 0-1.33.42-1.33 1.33v.52h3.09l-.09 2.15z" />
      </svg>
    ),
  },
]

export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [form, setForm] = useState({ name: "", contact: "", message: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 13,
    color: "#e6edf3",
    fontFamily: "Inter, sans-serif",
    width: "100%",
  }

  return (
    <div
      id="contact"
      className="relative overflow-hidden"
      style={{ background: "var(--contact-bg, #080c12)", padding: "80px 48px" }}
    >
      {/* Glow — dark mode */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 400,
          background: "radial-gradient(ellipse, rgba(88,166,255,0.06), transparent 70%)",
        }}
      />

      <div
        className="max-w-[960px] mx-auto relative flex gap-16 flex-wrap items-start"
      >
        {/* LEFT */}
        <div className="flex-1 min-w-[260px]">
          <p
            className="text-[10px] font-bold uppercase tracking-[2px] mb-[14px]"
            style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}
          >
            // contact
          </p>
          <h2
            className="font-black text-white mb-3"
            style={{ fontSize: "clamp(26px, 5vw, 46px)", letterSpacing: "-2px" }}
          >
            Have an idea?
            <br />
            Let&apos;s talk.
          </h2>
          <p className="text-[14px] mb-8" style={{ color: "#64748b", lineHeight: 1.7 }}>
            Tell me what you&apos;re building — even a rough idea is enough to start. First call is
            free.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-4 mb-8">
            {[
              { n: 1, title: "You send a message", sub: "Describe what you need — no brief required, just the gist." },
              { n: 2, title: "I reply within 24 hours", sub: "With questions, a rough timeline, and whether I'm a good fit." },
              { n: 3, title: "Free 30-min call", sub: "No pitch. We talk through the problem and I tell you exactly what I'd build." },
            ].map((s) => (
              <div key={s.n} className="flex gap-[14px] items-start">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold"
                  style={{
                    background: "var(--glow)",
                    border: "1px solid rgba(88,166,255,0.3)",
                    color: "var(--accent)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <div className="text-[12px] font-bold text-white mb-[2px]">{s.title}</div>
                  <div className="text-[11px] leading-[1.6]" style={{ color: "#64748b" }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social chips */}
          <div className="flex flex-wrap gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[6px] text-[12px] px-[14px] py-2 rounded-lg transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  textDecoration: "none",
                  fontFamily: "var(--mono)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                {s.icon}
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="flex-1 min-w-[280px] max-w-[420px]">
          <div
            className="p-7 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex items-center gap-2 text-[11px] font-semibold mb-5"
              style={{ color: "#22c55e", fontFamily: "var(--mono)" }}
            >
              <span className="pulse-dot inline-block w-[6px] h-[6px] rounded-full bg-green-500" />
              available · replies within 24h
            </div>

            {status === "sent" ? (
              <div className="text-center py-8">
                <div className="text-[32px] mb-3">✓</div>
                <div className="font-bold text-white mb-1">Message sent!</div>
                <div className="text-[12px]" style={{ color: "#64748b" }}>
                  I&apos;ll be in touch within 24 hours.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
                <input
                  style={inputStyle}
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <input
                  style={inputStyle}
                  placeholder="Email or WhatsApp"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  required
                />
                <textarea
                  style={{ ...inputStyle, height: 88, resize: "none" }}
                  placeholder="What are you building? (the messier the idea, the better)"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full py-[14px] rounded-[10px] text-[14px] font-bold text-white transition-all hover:-translate-y-[2px] disabled:opacity-60 mt-[2px]"
                  style={{ background: "var(--accent)", fontFamily: "var(--mono)" }}
                >
                  {status === "sending" ? "Sending..." : "Send message →"}
                </button>
                {status === "error" && (
                  <p className="text-[11px] text-center" style={{ color: "#ef4444" }}>
                    Something went wrong. Email me directly instead.
                  </p>
                )}
                <p
                  className="text-center text-[10px] mt-1"
                  style={{ color: "#334155", fontFamily: "var(--mono)" }}
                >
                  no spam · no pressure · just a conversation
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/Contact.tsx
git commit -m "feat: contact section with split layout + form"
```

---

## Task 15: Contact API route

**Files:**
- Create: `app/api/contact/route.ts`

- [ ] **Step 1: Create route**

```ts
// app/api/contact/route.ts
import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, contact, message } = await req.json()

  if (!name || !contact || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: "Portfolio Contact <onboarding@resend.dev>",
    to: process.env.CONTACT_EMAIL ?? "faruqdaniyan@gmail.com",
    subject: `New enquiry from ${name}`,
    text: `Name: ${name}\nContact: ${contact}\n\nMessage:\n${message}`,
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat: contact form API route via Resend"
```

---

## Task 16: Assemble page.tsx + footer

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Assemble all sections**

```tsx
// app/page.tsx
import { Hero } from "@/components/sections/Hero"
import { Projects } from "@/components/sections/Projects"
import { Process } from "@/components/sections/Process"
import { Services } from "@/components/sections/Services"
import { Availability } from "@/components/sections/Availability"
import { Stack } from "@/components/sections/Stack"
import { Testimonial } from "@/components/sections/Testimonial"
import { FAQ } from "@/components/sections/FAQ"
import { Contact } from "@/components/sections/Contact"

function Divider() {
  return (
    <div
      className="h-[1px] max-w-[960px] mx-auto"
      style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }}
    />
  )
}

export default function Page() {
  return (
    <>
      <Hero />
      <Divider />
      <Projects />
      <Divider />
      <Process />
      <Divider />
      <Services />
      <Divider />
      <Availability />
      <Divider />
      <Stack />
      <Testimonial />
      <Divider />
      <FAQ />
      <Contact />
      <footer
        className="relative z-[1] py-5 px-6 text-center text-[11px]"
        style={{
          background: "var(--bg2)",
          borderTop: "1px solid var(--border)",
          color: "var(--text3)",
          fontFamily: "var(--mono)",
        }}
      >
        {"{danfaruq}"} · built with React & Next.js · © 2026
      </footer>
    </>
  )
}
```

- [ ] **Step 2: Add CSS variable for hero background + contact bg to globals.css**

Add inside `:root`:
```css
--hero-bg: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f9ff 100%);
--contact-bg: #0f172a;
--nav-bg: rgba(255, 255, 255, 0.82);
```

Add inside `[data-theme="dark"]`:
```css
--hero-bg: radial-gradient(ellipse at 20% 40%, rgba(88,166,255,0.05) 0%, transparent 55%),
           radial-gradient(ellipse at 80% 70%, rgba(63,185,80,0.03) 0%, transparent 50%), #080c12;
--contact-bg: #080c12;
--nav-bg: rgba(8, 12, 18, 0.88);
```

- [ ] **Step 3: Full build check**

```bash
npm run build
# expect: ✓ Compiled successfully
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: assemble full page + footer"
```

---

## Task 17: Deploy to Vercel

- [ ] **Step 1: Create GitHub repo and push**

```bash
gh repo create danfaruq-portfolio --public --source=. --remote=origin --push
```

- [ ] **Step 2: Deploy via Vercel CLI**

```bash
npx vercel --yes
# follow prompts: link to new project, confirm settings
```

- [ ] **Step 3: Add environment variables in Vercel dashboard**

Go to Vercel project → Settings → Environment Variables → add:
- `RESEND_API_KEY` = your actual Resend key
- `CONTACT_EMAIL` = faruqdaniyan@gmail.com

- [ ] **Step 4: Add screenshots to public/screenshots/**

Take screenshots of the live E4G app (dashboard, my-work, grants, mobile) and place them at:
- `public/screenshots/e4g-dashboard.png`
- `public/screenshots/e4g-mywork.png`
- `public/screenshots/e4g-grants.png`
- `public/screenshots/e4g-mobile.png`

Then redeploy: `npx vercel --prod`

- [ ] **Step 5: Final commit**

```bash
git add public/screenshots/
git commit -m "feat: add E4G app screenshots"
git push origin main
```

---

## Self-Review

**Spec coverage check:**
- ✅ Scroll progress bar — Navbar.tsx
- ✅ `{danfaruq}` logo with blinking cursor — Navbar.tsx
- ✅ `● available` pill, hamburger menu, mobile fullscreen overlay — Navbar.tsx
- ✅ Theme toggle dark/light — ThemeProvider + Navbar
- ✅ Terminal line in hero (dark only) — Hero.tsx
- ✅ Gradient H1, stats strip, scroll hint — Hero.tsx
- ✅ Browser chrome app mockup — AppMockup.tsx
- ✅ `✓ shared with client permission` badge — AppMockup.tsx
- ✅ Tabbed case study (6 tabs) — TabPanel.tsx
- ✅ Walkthrough carousel (4 screens, prev/next, dots) — Walkthrough.tsx
- ✅ Terminal JSON block (dark mode only) — Projects.tsx
- ✅ Coming soon card — Projects.tsx
- ✅ 4-step process with hover top-bar — Process.tsx
- ✅ 6 service cards, 3-col → 1-col responsive — Services.tsx
- ✅ Stack pills with highlighted React/Next/TS — Stack.tsx
- ✅ Availability card with remote + reply time — Availability.tsx
- ✅ Testimonial placeholder — Testimonial.tsx
- ✅ FAQ accordion — FAQ.tsx
- ✅ Contact split layout — Contact.tsx
- ✅ 3-step "what happens next" — Contact.tsx
- ✅ Social chips (GitHub, LinkedIn, Fiverr) — Contact.tsx
- ✅ Form with Resend API — Contact.tsx + route.ts
- ✅ Mobile CTA bar — MobileCTA.tsx
- ✅ Footer — page.tsx
- ✅ FadeIn scroll animations on all sections — FadeIn.tsx

**Placeholder check:** No TBDs. All code blocks are complete.

**Type consistency:** `TAB_DATA`, `WALKTHROUGH_SCREENS`, `SERVICES`, `STACK`, `FAQ_ITEMS`, `PROCESS_STEPS` all defined in `lib/data.ts` and consumed by name in components.
