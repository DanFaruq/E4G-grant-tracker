# Dan Faruq — Portfolio Website Design Spec
**Date:** 2026-05-30  
**Status:** Approved for implementation

---

## Overview

A standalone interactive portfolio website for Dan Faruq, a full-stack developer. Primary goal: client acquisition. Visitors should leave knowing exactly what Dan builds, see proof it works, and have a frictionless path to hiring him.

**Separate repo** from E4G Grant Tracker. Deployed on Vercel.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, static export or SSG)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion (scroll reveals, page transitions)
- **Language:** TypeScript
- **Deployment:** Vercel
- **Forms:** Resend (contact form email delivery)
- **Fonts:** Inter (body) + JetBrains Mono (code/nav elements)

---

## Design System

### Theme
- **Light mode:** Clean professional — white/slate background, indigo accent (#4f46e5)
- **Dark mode:** Engineer/terminal aesthetic — near-black (#080c12) background, blue accent (#58a6ff), grid overlay, terminal code blocks
- Theme toggle persists in localStorage; defaults to dark

### Typography
- Headlines: Inter 900, tight letter-spacing (-2px to -3px)
- Body: Inter 400–600
- Code/nav: JetBrains Mono 500–700
- Gradient text on hero highlight: accent → accent2

### Motion
- Scroll progress bar at top (2px accent gradient)
- Framer Motion `fadeInUp` on all sections as they enter viewport
- Hover: `translateY(-3px)` + border-color accent on cards
- Nav links: bracket animation `[work]` on hover (CSS only)
- Hero terminal blink cursor (CSS animation)
- Spring easing throughout: `cubic-bezier(0.22, 1, 0.36, 1)`

---

## Navigation

Floating top bar, full-width, `backdrop-filter: blur(20px)`.

**Logo:** `{danfaruq}` in JetBrains Mono with blinking cursor  
**Status pill:** `● available` (green, hidden on mobile)  
**Nav links:** `work` `services` `process` `contact` (hidden on mobile)  
**CTA:** `$ hire_me →` button (hidden on mobile)  
**Theme toggle:** sun/moon icon button  
**Mobile:** Hamburger → fullscreen overlay menu with all links + CTA  

Scroll progress bar: 2px line at very top of viewport.

---

## Page Sections (top → bottom)

### 1. Hero
- `● available for new projects` badge (mono font, green dot)
- Dark mode only: terminal line `❯ danfaruq.build("your_idea")` with blinking cursor
- H1: "I build things / **people actually use.**" (gradient on second line)
- Subheading: full-stack React/Next.js/Supabase, landing pages to complex apps
- CTAs: `Book a free call →` (primary) + `See my work ↓` (secondary)
- Stats strip: `1+ Live clients` · `4wk Avg delivery` · `100% Ships to prod` · `Remote Works globally`
- Scroll indicator dot animation

### 2. Selected Projects
- Section label: `// work`
- **E4G Team card** — featured, full interactive treatment:
  - Browser chrome mockup showing real app UI (sidebar, KPIs, task rows)
  - Permission badge: `✓ shared with client permission`
  - Tags: NGO · Grant Management · Full-Stack · ● Live
  - Title + description
  - Dark mode: JSON terminal code block showing client/stack/status
  - **Tabbed sections (B):** overview / problem / build / tech_stack / results / live_demo
  - **App walkthrough carousel (C):** 4 annotated screens with prev/next — Dashboard, My Work, Grants, Mobile
  - Actions: `Explore case study →` + `View live app ↗`
- **Coming soon card:** dashed border, `⚙️ Next Project — in architecture phase`
- On mobile: sidebar hidden from app mockup, KPIs 2-column grid, chips wrap

### 3. My Process
- 4 cards: `01 Discover` → `02 Design` → `03 Build` → `04 Ship`
- Top accent bar animates in on hover (scaleX 0→1)
- 2-column on mobile

### 4. Services (6 cards, 3-col desktop / 2-col tablet / 1-col mobile)
1. 🚀 Landing Pages — "from idea to live in days"
2. 🌐 Business Websites — "Next.js or custom HTML/CSS"
3. ⚡ Web Applications — "React · Next.js · Supabase"
4. 🛠 Internal Tools — "your team's new favourite tool"
5. 📊 Dashboards & Reports — "connected to your data source"
6. 🎨 UI/UX Design + Build — "Figma → code, or design-as-I-build"

### 5. Availability
- "Open for projects." headline
- Works fully remote · clients worldwide
- Reply within 24 hours · starts within 1–2 weeks
- Right column: 4 bullet points (async-first, weekly updates, fixed-scope or retainer, 2-week post-launch support)

### 6. Tech Stack
- Pill tags: **React 19** · **Next.js 16** · **TypeScript** (highlighted) + Supabase · PostgreSQL · Tailwind CSS v4 · Framer Motion · shadcn/ui · Zod · Vercel · Web Push · Resend · HTML/CSS · Node.js
- Hover: translateY(-2px) + accent border/colour

### 7. Testimonial
- Placeholder for E4G Team quote (to be filled after outreach)
- Large quote mark, italic text, avatar initials, name + org

### 8. FAQ (accordion)
- How long does a project take?
- Do you do design too, or just development?
- What do you need from me to get started?
- Do you do ongoing maintenance?
- I'm not technical — will I understand what's being built?

### 9. Contact — "Have an idea? Let's talk."
Split layout (desktop): Left | Right

**Left:**
- `// contact` section label
- "Have an idea? Let's talk." headline
- Subtext: "Tell me what you're building — even a rough idea is enough."
- 3-step "what happens next":
  1. You send a message
  2. I reply within 24 hours
  3. Free 30-min call
- Social chips: GitHub · LinkedIn · Fiverr (icon + label each)

**Right:**
- Frosted card with `● available · replies within 24h` status
- Form: Name · Email or WhatsApp · Message textarea
- Submit: `Send message →`
- Microcopy: `no spam · no pressure · just a conversation`

On mobile: stacks vertically (headline → steps → form → social chips).

### Footer
`{danfaruq} · built with React & Next.js · © 2026`

### Mobile CTA bar
Fixed bottom bar on mobile only: full-width `Book a free call →` button.

---

## Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| < 480px | H1 letter-spacing reduced, single column everywhere |
| < 600px | App mockup sidebar hidden, KPIs 2-col, chips wrap |
| < 640px | Process 2-col, Services 1-col |
| < 768px | Nav collapses to hamburger, pills/CTA hidden |
| ≥ 768px | Full nav, contact split layout |

---

## Deployment

- New GitHub repo: `danfaruq-portfolio`
- Vercel project connected to repo
- Custom domain when ready
- Contact form → Resend API route → faruqdaniyan@gmail.com (not shown publicly)
- `.env.local`: `RESEND_API_KEY`

---

## Out of Scope (v1)
- Blog / writing section
- Dark/light per-section overrides
- Analytics (add Vercel Analytics in v2)
- CMS for case studies (hardcoded MDX in v1)
