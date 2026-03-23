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
| `amber-400` | `#f5a623` | Gradient end, data numbers (existing custom token) |
| `glass-bg` | `rgba(255,255,255,0.05)` | Card background |
| `glass-border` | `rgba(255,255,255,0.10)` | Card border |
| `glass-hover` | `rgba(255,255,255,0.08)` | Card hover background |
| `text-muted` | `rgba(255,255,255,0.40)` | Secondary text |

**Tailwind config changes:**

Keep the existing `amber.400: '#f5a623'` custom override — do NOT add `amber.300`. Hover amber states use Tailwind's built-in `amber-300` (`#fbbf24`) from the default scale. Add only the new `purple` scale and a `bg` default:

```ts
colors: {
  navy: { 900: '#0d0d1a', 800: '#16213e', 700: '#1a2a4a' }, // keep for any remaining uses
  amber: { 400: '#f5a623' },
  purple: {
    400: '#c084fc',
    500: '#a855f7',
    700: '#7c3aed',
  },
  bg: { DEFAULT: '#05050f' },
}
```

Replace all `bg-navy-900` body/layout background usages with `bg-bg` (or inline `#05050f`). Card backgrounds remain glass (inline rgba values, not Tailwind tokens).

### Typography

| Font | Usage |
|---|---|
| Space Grotesk (300–700) | All UI text, labels, headings |
| Space Mono (400, 700) | Numbers, data readouts, exercise details, ring % label |

Loaded via Google Fonts in `index.html`. Applied globally via `src/index.css`:

```css
body {
  font-family: 'Space Grotesk', sans-serif;
}
```

### Glass Card Spec

```
background: rgba(255,255,255,0.05)
border: 1px solid rgba(255,255,255,0.10)
border-radius: 24px (page-level cards) / 14px (small inline elements)
backdrop-filter: blur(20px)
-webkit-backdrop-filter: blur(20px)
```

Hover state: `background → rgba(255,255,255,0.08)`, `border-color → rgba(255,255,255,0.20)`.

### Animated Mesh Background

Three absolutely-positioned blurred orbs rendered once in `Layout.tsx`:

- **Orb 1**: 500×500px, `radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)`, `top: -100px; right: -100px`, `opacity: 0.5`, no delay
- **Orb 2**: 400×400px, `radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)`, `bottom: -100px; left: -50px`, `opacity: 0.3`, `animation-delay: -4s`
- **Orb 3**: 300×300px, `radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)`, `top: 40%; left: 30%`, `opacity: 0.2`, `animation-delay: -8s`

All use `filter: blur(80px); border-radius: 50%; position: absolute;` and the `drift` keyframe defined in `src/index.css`:

```css
@keyframes drift {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -20px) scale(1.05); }
  66%  { transform: translate(-20px, 25px) scale(0.97); }
  100% { transform: translate(0, 0) scale(1); }
}
```

Applied as: `animation: drift 12s ease-in-out infinite`.

### Noise Texture Overlay

Inline SVG rendered in `Layout.tsx`, `position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.04; width: 100%; height: 100%`. Full markup:

```jsx
<svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.04 }}>
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noiseOut" />
    <feColorMatrix type="saturate" values="0" in="noiseOut" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" />
</svg>
```

---

## Navigation

### Desktop (≥1024px) — Icon Sidebar (`src/components/Sidebar.tsx`)

**Full redesign. Props interface simplified:**

```ts
interface Props {
  section: Section
  onNavigate: (s: Section) => void
}
```

`isOpen` and `onClose` props are removed — they are replaced by `BottomNav` on mobile.

Visual spec:
- **Width**: 72px, `position: sticky; top: 0; height: 100vh`
- **Background**: `rgba(255,255,255,0.03)`, `border-right: 1px solid rgba(255,255,255,0.06)`, `backdrop-filter: blur(20px)`
- **Logo mark**: 40×40px rounded square (`border-radius: 12px`) with `background: linear-gradient(135deg, #7c3aed, #f5a623)`, 💪 emoji centered, `margin-bottom: 16px`
- **Nav items**: 44×44px rounded squares, emoji icons only, no text labels
- **Active state**: `background: rgba(124,58,237,0.2)` + 3px left-edge border strip (`position: absolute; left: 0; top: 25%; height: 50%; width: 3px; background: linear-gradient(180deg, #a855f7, #f5a623); border-radius: 0 3px 3px 0`)
- **Hover**: `background: rgba(255,255,255,0.08)`, Framer Motion `whileHover={{ scale: 1.1 }}` with `type: "spring", stiffness: 400, damping: 20`
- Rendered inside `<div className="hidden lg:flex">` in `Layout.tsx`

### Mobile (<1024px) — Bottom Tab Bar (`src/components/BottomNav.tsx` — NEW)

**Props interface:**

```ts
interface Props {
  section: Section
  onNavigate: (s: Section) => void
}
```

Visual spec:
- **Height**: 72px, `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40`
- **Background**: `rgba(10,8,20,0.90)`, `backdrop-filter: blur(20px)`, `border-top: 1px solid rgba(255,255,255,0.08)`
- **4 tabs**: Dashboard (📊 / "Dashboard"), Check-in (✏️ / "Check-in"), History (📅 / "History"), Measurements (📏 / "Measure")
- **Each tab**: icon (20px) + label (9px uppercase, `letter-spacing: 0.5px`), stacked vertically, `flex: 1`
- **Active tab**: icon Framer Motion `animate={{ y: -3 }}` with spring, gradient underline (`position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 24px; height: 2px; background: linear-gradient(90deg, #a855f7, #f5a623); border-radius: 2px`), label colour `#a855f7`
- **Inactive tabs**: label `rgba(255,255,255,0.30)`
- Rendered inside `<div className="lg:hidden">` in `Layout.tsx`

**`Layout.tsx` wiring:**
- Remove `sidebarOpen` state, `setSidebarOpen`, and the `<header className="lg:hidden …">` hamburger block
- Remove `isOpen` and `onClose` props passed to `<Sidebar>`
- `<main>` scroll container gains `pb-[72px] lg:pb-0` so content clears the 72px bar exactly
- Pass `section` and `onNavigate` to both `<Sidebar>` and `<BottomNav>`

### Page Transitions

In `Layout.tsx`, the existing `<Suspense>` wraps `<AnimatePresence>`, which wraps a `<motion.div key={section}>` that wraps `<ActivePage>`. This ordering ensures exit animations fire before React unmounts the lazy boundary:

```tsx
<Suspense fallback={null}>
  <AnimatePresence mode="wait">
    <motion.div
      key={section}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
    >
      <ActivePage />
    </motion.div>
  </AnimatePresence>
</Suspense>
```

Do NOT apply animation props to `<ActivePage>` directly — it is a plain function component and cannot accept motion props.

---

## Components

### StatCard (`src/components/StatCard.tsx`)

**Props interface update** (visual-only addition):

```ts
interface Props {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
  icon?: string  // emoji displayed above label, e.g. "⚖️"
}
```

Layout top-to-bottom: `icon` (24px, if present) → `label` (10px uppercase, `rgba(255,255,255,0.40)`) → animated value (Space Mono, 28px bold).

**Count-up animation:** Applied only when `typeof value === 'number'`. Use Framer Motion `useMotionValue(0)` + `animate(motionValue, value, { duration: 1, ease: "easeOut" })` on mount. Subscribe to the value with `useMotionValueEvent` (or `motionValue.on('change', ...)`) and store in local state to render as text. Format with `toFixed(2)` if `value` is not an integer (i.e. `value % 1 !== 0`), otherwise display as integer. String and null values render statically.

**Hover:** Wrap card in `<motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>`.

**Gradient value:** when `highlight === true`, apply `background: linear-gradient(135deg, #a855f7, #f5a623); -webkit-background-clip: text; color: transparent` to the value element.

**Glass card:** full spec from Design System section.

**Dashboard call-sites** (`src/pages/Dashboard.tsx`) — add `icon` prop to each of the 6 `<StatCard>` components:
- Current Weight → `icon="⚖️"`
- Total Lost → `icon="📉"`
- Meal Compliance → `icon="🍽️"`
- Workout Completion → `icon="💪"`
- Current Streak → `icon="🔥"`
- Weekly Loss Rate → `icon="📊"`

### StarRating (`src/components/StarRating.tsx`)

Replace each `<button>` with a Framer Motion `<motion.button>`:

- **Selected star** (`n <= value`): colour `#f5a623`, `whileTap={{ scale: 1.4 }}`, spring back with `type: "spring", stiffness: 400, damping: 15`
- **Unselected star**: colour `rgba(255,255,255,0.20)` (replaces `text-gray-600`)
- **Label**: `rgba(255,255,255,0.40)`, 11px uppercase — matches `text-muted` token
- No prop changes; `onChange` callback unchanged

### Toast (`src/components/Toast.tsx`)

Wrap entire toast in `<motion.div>`:

- `initial: { y: 80, opacity: 0 }`, `animate: { y: 0, opacity: 1 }`, `exit: { y: 80, opacity: 0 }`
- `transition: { type: "spring", stiffness: 280, damping: 24 }`
- Glass card: `background: rgba(255,255,255,0.10)`, `backdrop-filter: blur(20px)`, `border-radius: 16px`
- Error: `border: 1px solid rgba(239,68,68,0.50)`
- Success: `border: 1px solid rgba(74,222,128,0.50)`
- Wrap the `<Toast>` usage site in `<AnimatePresence>` in all four pages that use it: `Dashboard`, `CheckIn`, `History`, `Measurements`

---

## Pages

### Login (`src/pages/Login.tsx`)

- Full-screen: `min-height: 100vh`, same 3-orb mesh background (orbs rendered locally, same spec)
- Centered glass card: `max-width: 400px`, `padding: 32px`, `border-radius: 28px`, full glass spec
- Title: `"6 Pack Tracker"` — `background: linear-gradient(135deg, #a855f7, #f5a623); -webkit-background-clip: text; color: transparent`, Space Grotesk 700, 28px
- Input focus: `border-color: #f5a623`, `box-shadow: 0 0 0 3px rgba(245,166,35,0.15)`
- Submit button: `background: linear-gradient(135deg, #7c3aed, #f5a623)`, Framer Motion `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}` with spring
- Error message: Framer Motion `initial={{ opacity: 0, height: 0 }}` → `animate={{ opacity: 1, height: 'auto' }}` slide-down, colour `#f87171` (red-400)

### Countdown (`src/pages/Countdown.tsx`)

- Same full-screen mesh background
- Centered layout, glass card wrapper for countdown block
- Day number: Space Mono, 96px, `background: linear-gradient(135deg, #a855f7, #f5a623)` text gradient
- Spring bounce on mount: `initial={{ scale: 0.8, opacity: 0 }}` → `animate={{ scale: 1, opacity: 1 }}` with `type: "spring", stiffness: 200, damping: 18`
- "days to go" label: Space Grotesk, `rgba(255,255,255,0.40)`, 14px

### Dashboard (`src/pages/Dashboard.tsx`)

**Header:**
- Greeting: date string, 12px uppercase, `letter-spacing: 2px`, `rgba(255,255,255,0.40)`
- Headline: Static `"Good morning"` (no time-of-day logic) — Space Grotesk 700, `clamp(28px, 4vw, 48px)`, `background: linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))` text gradient

**Hero card** (glass, `padding: 28px`):

- Left side:
  - Day number: Space Mono, 80px, `background: linear-gradient(135deg, #a855f7, #f5a623)` text gradient, Framer Motion spring bounce on mount
  - "of 33" sub-label in `rgba(255,255,255,0.25)`, 28px
  - **Pace badge** (inline, below the day number): pill shape, `border-radius: 20px`, `padding: 4px 12px`, `font-size: 11px`. Colours match the Pace banner state — on track: `background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.30); color: #4ade80`; behind: amber/red equivalents using the same rgba values as the Pace banner. Text content: `"On Track"`, `"Slightly Behind"`, or `"Behind"`. 6×6px pulsing dot to the left using the same `pulse` keyframe.
  - Projected weight line: 12px, `rgba(255,255,255,0.35)`

- Right side — SVG ring progress:
  - `viewBox="0 0 120 120"`, `cx="60"`, `cy="60"`, `r="50"`, `stroke-width="8"`
  - Background ring: plain `<circle>`, `stroke="rgba(255,255,255,0.08)"`, `fill="none"`
  - Progress ring: **`<motion.circle>`** (Framer Motion), `stroke="url(#ringGradient)"`, `fill="none"`, `stroke-linecap="round"`, CSS `style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}` (do NOT use SVG `transform` attribute — CSS units are required)
  - `<defs>` contains: `<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#f5a623"/></linearGradient>`
  - Full circumference = `2π × 50 ≈ 314`. `stroke-dasharray="314"`. On mount animate `stroke-dashoffset` from `314` to `(1 - progress) × 314` by passing a Framer Motion `MotionValue` (via `useMotionValue(314)` + `animate()`) directly to `<motion.circle strokeDashoffset={motionValue}>` — this works because `motion.circle` accepts `MotionValue` for SVG attributes. Use `type: "spring", stiffness: 60, damping: 18`
  - Percentage label: absolutely centered inside a wrapper `<div style={{ position: 'relative' }}>` that wraps both the `<svg>` and a centered `<span>`, Space Mono, 18px bold, white

**Stats grid:**
- 6 `<StatCard>` components with `icon` prop (see StatCard spec)
- Grid: `grid-cols-2 lg:grid-cols-3`, `gap: 12px`
- Stagger entrance: Framer Motion `variants` with `staggerChildren: 0.06`, `delayChildren: 0.1`. Each card: `hidden: { opacity: 0, y: 20 }` → `visible: { opacity: 1, y: 0 }` with spring

**Pace banner:**
- Rounded glass card (`border-radius: 16px`)
- On track (green): `box-shadow: 0 0 0 1px rgba(74,222,128,0.4), 0 0 16px rgba(74,222,128,0.15)`, `background: rgba(74,222,128,0.06)`
- Slightly behind (yellow): `box-shadow: 0 0 0 1px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.15)`, `background: rgba(251,191,36,0.06)`
- Behind (red): `box-shadow: 0 0 0 1px rgba(239,68,68,0.4), 0 0 16px rgba(239,68,68,0.15)`, `background: rgba(239,68,68,0.06)`
- Pulsing dot: 8×8px circle, matching colour, CSS `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`, `animation: pulse 2s ease-in-out infinite`

**Stall alert:**
- `background: linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.04))`, `border: 1px solid rgba(245,166,35,0.20)`, `border-radius: 20px`
- Tip items: Framer Motion stagger, `initial: { opacity: 0, x: -8 }` → `animate: { opacity: 1, x: 0 }`, 80ms between each

**Weight chart (Recharts):**
- Container: glass card (full spec)
- `XAxis`/`YAxis` stroke: `rgba(255,255,255,0.12)`; tick fill: `rgba(255,255,255,0.35)`
- Tooltip: `contentStyle: { background: 'rgba(10,8,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(20px)' }`
- No changes to data or `getExpectedWeight` logic

**Workout card:**
- Glass card + `background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,166,35,0.06))`
- Exercise detail values: Space Mono, `#f5a623`

### CheckIn (`src/pages/CheckIn.tsx`)

All `<section>` blocks become glass cards (full spec). No logic changes.

- Input focus: `border-color: #f5a623`, `box-shadow: 0 0 0 3px rgba(245,166,35,0.15)` via CSS `focus:` or inline style
- On Plan toggle button: Framer Motion `whileTap={{ scale: 0.95 }}` spring; green glass tint: `background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.25)`; red glass tint: `background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25)`
- Workout status buttons: active gets `background: linear-gradient(135deg, #7c3aed, #f5a623)`, `color: white`; Framer Motion `whileTap={{ scale: 0.97 }}` spring
- Save button: `background: linear-gradient(135deg, #7c3aed, #f5a623)`, `border-radius: 16px`, Framer Motion `whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}` spring; spinner icon replaces text when `saving === true`
- Weight delta: Framer Motion `initial={{ opacity: 0, y: -4 }}` → `animate={{ opacity: 1, y: 0 }}` on appearance

### History (`src/pages/History.tsx`)

- Summary bar: 6 mini glass stat tiles — `padding: 12px`, `border-radius: 16px`, full glass spec
- Both tables: glass container (`border-radius: 24px`, `overflow: hidden`)
- Table rows: `transition: background 0.15s`, `hover: rgba(255,255,255,0.04)`
- Off-plan meal rows: `background: rgba(239,68,68,0.08)`
- Row entrance: Framer Motion `staggerChildren: 0.04` on `<tbody>`, each `<tr>`: `initial: { opacity: 0 }` → `animate: { opacity: 1 }`

### Measurements (`src/pages/Measurements.tsx`)

- Form section: glass card
- 3 measurement inputs: `grid-cols-3`, glass input styling (same as CheckIn)
- Date picker: glass styled, amber focus ring
- Save button: same gradient + spring spec as CheckIn
- History table: glass container, delta cells Space Mono — green (`rgba(74,222,128,1)`) for improvement, red (`rgba(239,68,68,1)`) for regression

---

## Files Changed

| File | Change |
|---|---|
| `index.html` | Add Google Fonts link (Space Grotesk + Space Mono) |
| `tailwind.config.ts` | Add `purple` scale, add `bg` default token |
| `src/index.css` | Global font, `drift` keyframe, `pulse` keyframe, custom scrollbar |
| `src/components/Layout.tsx` | Mesh bg, orbs, noise, dual nav, AnimatePresence, remove hamburger header + sidebarOpen state |
| `src/components/Sidebar.tsx` | Full redesign — simplified props, glass, gradient active state |
| `src/components/BottomNav.tsx` | **NEW** — mobile bottom tab bar |
| `src/components/StatCard.tsx` | Add `icon` prop, glass card, count-up animation, hover spring |
| `src/components/Toast.tsx` | Spring slide-up, glass styling, AnimatePresence wrapper |
| `src/components/StarRating.tsx` | Motion buttons, spring on tap, updated colours |
| `src/pages/Login.tsx` | Mesh bg, glass card, gradient title, spring button |
| `src/pages/Countdown.tsx` | Mesh bg, glass card, spring bounce, gradient number |
| `src/pages/Dashboard.tsx` | Full redesign — ring hero, stagger stats, glass cards, restyled chart, pace banner glow |
| `src/pages/CheckIn.tsx` | Glass sections, amber focus, spring interactions, gradient save button |
| `src/pages/History.tsx` | Glass tables, stagger rows, mini glass summary tiles |
| `src/pages/Measurements.tsx` | Glass form, styled table, gradient save button |

---

## Dependencies

| Package | Purpose |
|---|---|
| `framer-motion` | Spring animations, AnimatePresence, page transitions, count-up |

Install: `npm install framer-motion`

No other new dependencies. Tailwind v3 supports all required utilities. Recharts, date-fns, and Supabase unchanged.

---

## Constraints

- **No logic changes**: All Supabase queries, computation functions, types, routing, and auth remain identical
- **No test changes**: Pure visual layer — existing 46 tests continue to pass unchanged
- **TypeScript**: All new code must pass `npx tsc --noEmit` with zero errors
- **`erasableSyntaxOnly: true`**: No TypeScript enums — string union types only
- **Build**: `npm run build` must succeed after all changes
- **Existing functionality**: Auth gate, countdown, programme state routing — all preserved
- **`Section` type**: Remains in `src/types/index.ts`; `BottomNav` imports it from there
