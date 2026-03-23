# UI Redesign — Awwwards-Level Glass & Glow

**Date:** 2026-03-23
**Project:** sk-give-me-6-packs (33-day fat loss tracker)
**Scope:** Full visual redesign — no logic, data, or routing changes

---

## Overview

Replace the current flat dark-navy UI with an Awwwards-quality "Glass & Glow" aesthetic: animated gradient mesh background, frosted glass cards, purple + amber gradient palette, spring-physics animations, and a responsive navigation system (icon sidebar on desktop, bottom tab bar on mobile). All existing business logic, Supabase data fetching, and page structure remain unchanged.

---

## Design System

### Colour Palette

| Token | Value | Usage |
|---|---|---|
| `bg` | `#05050f` | Page background |
| `purple-700` | `#7c3aed` | Primary accent, sidebar active bg |
| `purple-500` | `#a855f7` | Gradient start, ring stroke |
| `purple-400` | `#c084fc` | Hover states, light accents |
| `amber-400` | `#f5a623` | Gradient end, data numbers (unchanged) |
| `amber-300` | `#fbbf24` | Hover amber |
| `glass-bg` | `rgba(255,255,255,0.05)` | Card background |
| `glass-border` | `rgba(255,255,255,0.10)` | Card border |
| `glass-hover` | `rgba(255,255,255,0.08)` | Card hover background |
| `text-muted` | `rgba(255,255,255,0.40)` | Secondary text |

Tailwind config gains a `purple` scale (`400`, `500`, `700`) and the background is updated from `navy-900` to `bg` (`#05050f`).

### Typography

| Font | Usage |
|---|---|
| Space Grotesk (300–700) | All UI text, labels, headings |
| Space Mono (400, 700) | Numbers, data readouts, exercise details |

Loaded via Google Fonts in `index.html`. Applied globally via `src/index.css` (`font-family: 'Space Grotesk', sans-serif`).

### Glass Card

```
background: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.10)
border-radius: 24px (cards) / 14px (small)
backdrop-filter: blur(20px)
```

Hover state: `background` → `rgba(255,255,255,0.08)`, `border-color` → `rgba(255,255,255,0.20)`.

### Animated Mesh Background

Three absolutely-positioned blurred orbs rendered once in `Layout.tsx`, persisting across all pages:

- **Orb 1**: 500×500px, `radial-gradient(#7c3aed → transparent)`, top-right, `opacity: 0.5`
- **Orb 2**: 400×400px, `radial-gradient(#f5a623 → transparent)`, bottom-left, `opacity: 0.3`
- **Orb 3**: 300×300px, `radial-gradient(#a855f7 → transparent)`, center, `opacity: 0.2`

All three use a 12-second `drift` CSS keyframe (`translate + scale`), staggered by `-4s` and `-8s`. A noise texture SVG overlay (`opacity: 0.04`) adds grain depth.

### Noise Texture

Inline SVG `feTurbulence` filter applied as a `position: fixed; inset: 0; pointer-events: none; opacity: 0.04` overlay in `Layout.tsx`.

---

## Navigation

### Desktop (≥1024px) — Icon Sidebar

`src/components/Sidebar.tsx` redesigned:

- **Width**: 72px, fixed, full height
- **Background**: `rgba(255,255,255,0.03)`, `border-right: 1px solid rgba(255,255,255,0.06)`, `backdrop-filter: blur(20px)`
- **Logo mark**: 40×40px rounded square with `linear-gradient(135deg, #7c3aed, #f5a623)`, 💪 emoji
- **Nav items**: 44×44px rounded squares, emoji icons only, no labels
- **Active state**: `background: rgba(124,58,237,0.2)` + 3px left border `linear-gradient(#a855f7, #f5a623)`
- **Hover**: `background: rgba(255,255,255,0.08)` with spring scale

### Mobile (<1024px) — Bottom Tab Bar

New component `src/components/BottomNav.tsx`:

- **Height**: 72px, fixed bottom, full width
- **Background**: `rgba(10,8,20,0.90)`, `backdrop-filter: blur(20px)`, `border-top: 1px solid rgba(255,255,255,0.08)`
- **4 tabs**: Dashboard (📊), Daily Check-in (✏️), History (📅), Measurements (📏)
- **Each tab**: icon + label (9px uppercase), stacked vertically
- **Active**: Icon springs up 3px (Framer Motion spring), gradient underline (2px, `#a855f7 → #f5a623`) draws in, label turns `#a855f7`
- **Inactive**: `rgba(255,255,255,0.30)` label colour

`Layout.tsx` renders `<Sidebar>` inside `lg:flex hidden` and `<BottomNav>` inside `lg:hidden`.

### Page Transitions

`AnimatePresence` wraps the active page in `Layout.tsx`. Each page mounts with:

```
initial: { opacity: 0, y: 16 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -8 }
transition: { type: "spring", stiffness: 280, damping: 24 }
```

---

## Components

### StatCard (`src/components/StatCard.tsx`)

- Glass card (24px radius, full spec above)
- **Count-up animation**: value animates from 0 → actual using Framer Motion `useMotionValue` + `animate()` on mount. Numbers display via `Space Mono`.
- **Hover**: Framer Motion `whileHover={{ scale: 1.02, y: -4 }}` with spring
- **Gradient value**: when `highlight` prop is true, value uses `linear-gradient(135deg, #a855f7, #f5a623)` text gradient
- Small icon slot (emoji) above the label

### Toast (`src/components/Toast.tsx`)

- Slides up from bottom with spring: `initial: { y: 80, opacity: 0 }`, `animate: { y: 0, opacity: 1 }`
- Glass card styling (`rgba(255,255,255,0.10)` bg + blur)
- Error: `border: 1px solid rgba(239,68,68,0.5)`, red tint
- Success: `border: 1px solid rgba(74,222,128,0.5)`, green tint

---

## Pages

### Login (`src/pages/Login.tsx`)

- Full-screen mesh background (same orbs)
- Centered glass card (max-width 400px, 32px padding, 28px radius)
- Title: `6 Pack Tracker` with `linear-gradient(135deg, #a855f7, #f5a623)` text gradient, Space Grotesk 700
- Input focus: `border-color: #f5a623`, `box-shadow: 0 0 0 3px rgba(245,166,35,0.15)`
- Submit button: `linear-gradient(135deg, #7c3aed, #f5a623)`, spring scale on hover/tap
- Error message: slides down with spring, red-400

### Countdown (`src/pages/Countdown.tsx`)

- Same full-screen mesh background
- Large day number with gradient, Space Mono font, spring bounce on mount
- Glass card wrapper for the countdown

### Dashboard (`src/pages/Dashboard.tsx`)

**Header:**
- Greeting line (date, 11px uppercase, muted)
- Headline: "Good morning" — large gradient text, Space Grotesk 700

**Hero card** (glass, 28px padding):
- Left: Day number (80px, Space Mono, gradient) + "of 33" + pace badge (pulsing green dot)
- Right: SVG ring progress — draws with spring on mount (stroke-dashoffset animation), gradient stroke, percentage label center
- Below: projected weight line

**Stats grid** (2 cols mobile, 3 cols desktop):
- 6 StatCard components with count-up + hover spring
- Icons: ⚖️ 🍽️ 🔥 💪 📉 💧

**Stagger entrance**: Stats grid children animate in with 60ms stagger using Framer Motion `variants` + `staggerChildren`

**Pace banner**: Rounded glass card with coloured glowing border (green/yellow/red). Pulsing dot indicator.

**Stall alert**: Amber-tinted glass card, tip items fade in staggered.

**Weight chart**: Existing Recharts `LineChart` restyled — `bg-glass` container, axis colours updated to match palette, tooltip glass styled.

**Workout card**: Glass card with purple gradient tint (`linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,166,35,0.08))`). Exercise rows with `Space Mono` detail values.

### CheckIn (`src/pages/CheckIn.tsx`)

All existing `<section>` blocks become glass cards (24px radius). No logic changes.

- **Input focus**: amber glow ring (`box-shadow: 0 0 0 3px rgba(245,166,35,0.15)`)
- **On Plan / Off Plan toggle**: spring scale on tap, green/red glass tint
- **Workout status buttons**: active gets gradient bg, spring scale on selection
- **StarRating**: stars spring-scale on selection
- **Save button**: gradient bg, spring scale, shows spinner icon (not just text) while saving
- **Weight delta**: green/red with spring entrance

### History (`src/pages/History.tsx`)

- Summary bar: 6 mini glass stat tiles (same glass spec, slightly smaller padding)
- Both tables wrapped in glass containers (`overflow-hidden`, `border-radius: 24px`)
- Table rows: `hover:bg-white/5` transition
- Off-plan meal rows: `bg-red-500/10` tint
- Row entrance: stagger fade-in on mount

### Measurements (`src/pages/Measurements.tsx`)

- Form section: glass card
- 3 inputs side by side in a grid
- Date picker: glass styled, amber focus
- Save button: gradient, spring, loading state
- History table: glass container, delta cells green/red with `Space Mono`

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | Add Google Fonts link (Space Grotesk + Space Mono) |
| `tailwind.config.ts` | Add `purple` scale, update `bg` colour |
| `src/index.css` | Global font, scrollbar, animation utilities |
| `src/components/Layout.tsx` | Mesh bg, orbs, noise, dual nav, AnimatePresence |
| `src/components/Sidebar.tsx` | Full redesign — glass, gradient active state |
| `src/components/BottomNav.tsx` | **NEW** — mobile bottom tab bar |
| `src/components/StatCard.tsx` | Glass, count-up, hover spring |
| `src/components/Toast.tsx` | Spring slide-up, glass styling |
| `src/components/StarRating.tsx` | Spring scale on selection |
| `src/pages/Login.tsx` | Mesh bg, glass card, gradient title |
| `src/pages/Countdown.tsx` | Mesh bg, glass card, spring countdown |
| `src/pages/Dashboard.tsx` | Full redesign — ring, hero, stagger, glass |
| `src/pages/CheckIn.tsx` | Glass sections, spring interactions |
| `src/pages/History.tsx` | Glass tables, stagger rows |
| `src/pages/Measurements.tsx` | Glass form, styled table |

---

## Dependencies

| Package | Purpose |
|---|---|
| `framer-motion` | Spring animations, AnimatePresence, count-up |

Install: `npm install framer-motion`

No other new dependencies. Tailwind v3 already supports all required utilities. Existing Recharts, date-fns, Supabase unchanged.

---

## Constraints

- **No logic changes**: All Supabase queries, computation functions, types, and routing remain identical
- **No test changes**: Pure visual layer — existing 46 tests continue to pass unchanged
- **TypeScript**: All new code must type-check with `npx tsc --noEmit` producing zero errors
- **`erasableSyntaxOnly: true`**: No TypeScript enums — string union types only
- **Build**: `npm run build` must succeed after all changes
- **Existing functionality**: Auth gate, countdown, programme state routing — all preserved
