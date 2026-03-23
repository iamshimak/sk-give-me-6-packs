# UI Redesign — Glass & Glow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat dark-navy UI with an Awwwards-quality "Glass & Glow" aesthetic — animated gradient mesh background, frosted glass cards, Space Grotesk/Mono typography, Framer Motion spring animations, and dual navigation (72px icon sidebar desktop / fixed bottom tab bar mobile).

**Architecture:** Pure visual layer swap. All Supabase queries, computation functions, types, routing, and the 46 existing tests remain untouched. A new `BottomNav` component replaces the old hamburger + slide-out drawer. `Sidebar` loses `isOpen`/`onClose` props (breaking change — Sidebar and Layout are updated together in Task 3). All animations via Framer Motion.

**Tech Stack:** React 19 + TypeScript (erasableSyntaxOnly: true, no enums), Vite, Tailwind CSS v3, Framer Motion, Google Fonts (Space Grotesk + Space Mono)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify | Add Google Fonts link |
| `tailwind.config.ts` | Modify | Add `purple` scale + `bg` token |
| `src/index.css` | Modify | Space Grotesk font, `drift`/`pulse` keyframes, `.glass-input` class, scrollbar |
| `src/components/BottomNav.tsx` | **Create** | Fixed 72px mobile bottom tab bar (4 tabs, spring active icon) |
| `src/components/Sidebar.tsx` | Modify | 72px icon-only sidebar, remove `isOpen`/`onClose` props |
| `src/components/Layout.tsx` | Modify | Mesh orbs, noise overlay, dual nav, AnimatePresence page transitions |
| `src/components/StatCard.tsx` | Modify | Add `icon` prop, count-up animation, glass card, hover spring |
| `src/components/Toast.tsx` | Modify | Spring slide-up, glass styling |
| `src/components/StarRating.tsx` | Modify | Motion buttons, spring tap, updated colours |
| `src/pages/Login.tsx` | Modify | Mesh bg, glass card, gradient title, spring button, animated error |
| `src/pages/Countdown.tsx` | Modify | Mesh bg, glass card, spring bounce on day number |
| `src/pages/Dashboard.tsx` | Modify | SVG ring hero, gradient header, pace badge, stagger stats, glass cards |
| `src/pages/CheckIn.tsx` | Modify | Glass sections, amber focus inputs, spring interactions, gradient save |
| `src/pages/History.tsx` | Modify | Glass tables, stagger row entrances, mini glass summary tiles |
| `src/pages/Measurements.tsx` | Modify | Glass form, styled table, gradient save button |

---

## Reusable style values (reference throughout)

```ts
// Glass card — page-level
const GLASS = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 24,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
} satisfies React.CSSProperties

// Glass card — small (stat tiles, inline elements)
const GLASS_SM = { ...GLASS, borderRadius: 14 } satisfies React.CSSProperties

// Gradient button
const GRAD_BTN = {
  background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
  borderRadius: 16,
  color: 'white',
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
} satisfies React.CSSProperties

// Gradient text
const gradientTextStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #a855f7, #f5a623)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}
```

These are defined at module scope in each file that needs them — no shared utility file.

---

## Task 1: Foundation — Framer Motion, Tailwind tokens, fonts, keyframes

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Install framer-motion**

```bash
npm install framer-motion
```

Expected: `framer-motion` in `package.json` dependencies. No errors.

- [ ] **Step 2: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d0d1a',
          800: '#16213e',
          700: '#1a2a4a',
        },
        amber: { 400: '#f5a623' },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          700: '#7c3aed',
        },
        bg: { DEFAULT: '#05050f' },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>6 Pack Tracker</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Space Grotesk', sans-serif;
  background-color: #05050f;
  color: #fff;
}

@keyframes drift {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -20px) scale(1.05); }
  66%  { transform: translate(-20px, 25px) scale(0.97); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Glass input — used in CheckIn, Measurements, Login */
.glass-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  color: white;
  width: 100%;
  outline: none;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.glass-input:focus {
  border-color: #f5a623;
  box-shadow: 0 0 0 3px rgba(245,166,35,0.15);
}
.glass-input::placeholder {
  color: rgba(255,255,255,0.25);
}
input[type="date"].glass-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.4;
}
textarea.glass-input {
  resize: none;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
```

- [ ] **Step 5: Verify TypeScript and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: Zero errors, build succeeds.

- [ ] **Step 6: Run existing tests**

```bash
npm test -- --run
```

Expected: All 46 tests pass.

- [ ] **Step 7: Commit**

```bash
git add index.html tailwind.config.ts src/index.css package.json package-lock.json
git commit -m "feat: install framer-motion, add purple/bg tokens, Space Grotesk/Mono fonts, keyframes, glass-input"
```

---

## Task 2: Create BottomNav Component

**Files:**
- Create: `src/components/BottomNav.tsx`

- [ ] **Step 1: Create `src/components/BottomNav.tsx`**

```tsx
import { motion } from 'framer-motion'
import type { Section } from '../types'

const TABS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'checkin', icon: '✏️', label: 'Check-in' },
  { id: 'history', icon: '📅', label: 'History' },
  { id: 'measurements', icon: '📏', label: 'Measure' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function BottomNav({ section, onNavigate }: Props) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: 'rgba(10,8,20,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 40,
      }}
    >
      {TABS.map((tab) => {
        const active = section === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: '100%',
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <motion.span
              style={{ fontSize: 20, display: 'block', lineHeight: 1 }}
              animate={{ y: active ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {tab.icon}
            </motion.span>
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: active ? '#a855f7' : 'rgba(255,255,255,0.30)',
              }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #a855f7, #f5a623)',
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: create BottomNav mobile bottom tab bar"
```

---

## Task 3: Redesign Sidebar + Layout (coupled — props change)

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Layout.tsx`

These two files must be updated in the same commit because Sidebar's Props interface changes (removing `isOpen`/`onClose`) and Layout must stop passing those props simultaneously to avoid TypeScript errors.

- [ ] **Step 1: Replace `src/components/Sidebar.tsx`**

```tsx
import { motion } from 'framer-motion'
import type { Section } from '../types'

const NAV_ITEMS: { id: Section; icon: string }[] = [
  { id: 'dashboard', icon: '📊' },
  { id: 'checkin', icon: '✏️' },
  { id: 'history', icon: '📅' },
  { id: 'measurements', icon: '📏' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function Sidebar({ section, onNavigate }: Props) {
  return (
    <aside
      style={{
        width: 72,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          marginBottom: 16,
        }}
      >
        💪
      </div>

      {NAV_ITEMS.map((item) => {
        const active = section === item.id
        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              border: 'none',
              background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
              position: 'relative',
              color: 'inherit',
            }}
          >
            {item.icon}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: 3,
                  background: 'linear-gradient(180deg, #a855f7, #f5a623)',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            )}
          </motion.button>
        )
      })}
    </aside>
  )
}
```

> **Note on `whileHover` TypeScript:** If the `background` prop on `whileHover` causes a TS error (motion's `whileHover` types don't always include all CSS properties), simplify to just `whileHover={{ scale: 1.1 }}` and handle the background with a CSS hover class instead. The scale spring is the important part.

- [ ] **Step 2: Replace `src/components/Layout.tsx`**

```tsx
import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Section } from '../types'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const CheckIn = lazy(() => import('../pages/CheckIn'))
const History = lazy(() => import('../pages/History'))
const Measurements = lazy(() => import('../pages/Measurements'))

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

function ActivePage({ section }: { section: Section }) {
  if (section === 'dashboard') return <Dashboard />
  if (section === 'checkin') return <CheckIn />
  if (section === 'history') return <History />
  return <Measurements />
}

export default function Layout({ section, onNavigate }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#05050f', overflow: 'hidden', position: 'relative' }}>

      {/* Animated mesh orbs — fixed, behind everything */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)',
          top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)',
          bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
          animationDelay: '-4s',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)',
          top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
          animationDelay: '-8s',
        }} />
      </div>

      {/* Noise texture overlay */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.04 }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noiseOut" />
          <feColorMatrix type="saturate" values="0" in="noiseOut" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex" style={{ position: 'relative', zIndex: 10 }}>
        <Sidebar section={section} onNavigate={onNavigate} />
      </div>

      {/* Main scrollable content */}
      <main
        className="pb-[72px] lg:pb-0"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', position: 'relative', zIndex: 2 }}
      >
        <Suspense fallback={null}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <ActivePage section={section} />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav section={section} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript and run tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero TS errors, all 46 tests pass.

- [ ] **Step 4: Verify the app renders without a white screen**

```bash
npm run dev
```

Open `http://localhost:5173`. After login: sidebar visible on desktop, bottom nav visible on mobile (resize window). Page transition animates when switching sections. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Layout.tsx
git commit -m "feat: redesign Sidebar to 72px icon strip, wire Layout with BottomNav and AnimatePresence"
```

---

## Task 4: Redesign StatCard Component

**Files:**
- Modify: `src/components/StatCard.tsx`

The component gains an `icon` prop and count-up animation for numeric values. String and null values render statically.

- [ ] **Step 1: Replace `src/components/StatCard.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

interface Props {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
  icon?: string
}

export default function StatCard({ label, value, unit, highlight, icon }: Props) {
  const motionVal = useMotionValue(0)
  const [displayNum, setDisplayNum] = useState('0')

  useEffect(() => {
    if (typeof value !== 'number') return
    // Set immediately so there's no flash of '0' if animation is skipped
    setDisplayNum(value % 1 !== 0 ? value.toFixed(2) : String(Math.round(value)))
    const controls = animate(motionVal, value, { duration: 1, ease: 'easeOut' })
    const unsub = motionVal.on('change', (v) => {
      setDisplayNum(value % 1 !== 0 ? v.toFixed(2) : String(Math.round(v)))
    })
    return () => {
      controls.stop()
      unsub()
    }
  }, [value]) // motionVal is a stable ref — safe to omit from deps

  const display =
    value === null
      ? '—'
      : typeof value === 'number'
        ? `${displayNum}${unit ? ' ' + unit : ''}`
        : `${value}${unit ? ' ' + unit : ''}`

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 16,
        cursor: 'default',
      }}
    >
      {icon && (
        <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      )}
      <p style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.40)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 4,
      }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          margin: 0,
          ...(highlight
            ? {
                background: 'linear-gradient(135deg, #a855f7, #f5a623)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            : { color: '#fff' }),
        }}
      >
        {display}
      </p>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify TypeScript and tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, 46 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatCard.tsx
git commit -m "feat: redesign StatCard with icon prop, count-up animation, glass card, hover spring"
```

---

## Task 5: Redesign Toast + StarRating Components

**Files:**
- Modify: `src/components/Toast.tsx`
- Modify: `src/components/StarRating.tsx`

- [ ] **Step 1: Replace `src/components/Toast.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  message: string
  type?: 'error' | 'success'
  onDismiss: () => void
}

export default function Toast({ message, type = 'error', onDismiss }: Props) {
  const onDismissRef = useRef(onDismiss)
  useEffect(() => { onDismissRef.current = onDismiss })
  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), 4000)
    return () => clearTimeout(t)
  }, []) // empty deps — timer starts once on mount

  const borderColor = type === 'error'
    ? 'rgba(239,68,68,0.50)'
    : 'rgba(74,222,128,0.50)'

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        position: 'fixed',
        bottom: 88, // above the 72px bottom nav on mobile
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        color: 'white',
        fontWeight: 500,
        zIndex: 50,
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </motion.div>
  )
}
```

- [ ] **Step 2: Replace `src/components/StarRating.tsx`**

```tsx
import { motion } from 'framer-motion'

interface Props {
  value: number | null
  onChange: (v: number) => void
  label: string
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div>
      <p style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.40)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 6,
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            whileTap={{ scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{
              fontSize: 24,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              color: value !== null && n <= value ? '#f5a623' : 'rgba(255,255,255,0.20)',
              lineHeight: 1,
            }}
          >
            ★
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript and tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, 46 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/Toast.tsx src/components/StarRating.tsx
git commit -m "feat: redesign Toast with glass spring animation, StarRating with motion tap"
```

---

## Task 6: Redesign Login + Countdown Pages

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Countdown.tsx`

These pages render outside `Layout`, so they need their own mesh orb background.

- [ ] **Step 1: Replace `src/pages/Login.tsx`**

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onLogin: () => void
}

// Three mesh orbs — same spec as Layout but rendered locally
function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)', top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-4s' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-8s' }} />
    </div>
  )
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validUser = import.meta.env.VITE_APP_USER
    const validPass = import.meta.env.VITE_APP_PASS
    if (username === validUser && password === validPass) {
      localStorage.setItem('ft_auth', '1')
      onLogin()
    } else {
      setError('Incorrect username or password')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 400,
          padding: 32,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 28,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          margin: '0 16px',
        }}
      >
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #a855f7, #f5a623)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          6 Pack Tracker
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              autoComplete="current-password"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ color: '#f87171', fontSize: 13, margin: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              padding: '12px 0',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/pages/Countdown.tsx`**

```tsx
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { PROGRAMME_START } from '../lib/constants'

function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)', top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-4s' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-8s' }} />
    </div>
  )
}

export default function Countdown() {
  const today = new Date().toISOString().slice(0, 10)
  const days = differenceInCalendarDays(parseISO(PROGRAMME_START), parseISO(today))

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <MeshBackground />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 16px' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #a855f7, #f5a623)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          6 Pack Tracker
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, marginBottom: 4 }}>
          Programme starts on
        </p>
        <p style={{ color: 'white', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
          {format(parseISO(PROGRAMME_START), 'MMMM d, yyyy')}
        </p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '32px 48px',
          }}
        >
          <p style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            lineHeight: 1,
            background: 'linear-gradient(135deg, #a855f7, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            {days}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, marginTop: 8 }}>
            days to go
          </p>
        </motion.div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript and tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, 46 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx src/pages/Countdown.tsx
git commit -m "feat: redesign Login and Countdown with mesh background, glass cards, spring animations"
```

---

## Task 7: Redesign Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

This is the most complex task. The existing data-fetching logic (lines 1–103 of the current file) is **preserved exactly**. Only the JSX return statement and module-scope style maps are changed. Two new Framer Motion hooks are added before the early-return guards.

- [ ] **Step 1: Replace `src/pages/Dashboard.tsx`**

Keep all existing imports and add new ones at the top. Keep `paceColor`/`paceLabel` maps replaced with the new style objects. Keep all data-fetching `useEffect` and computed variables unchanged.

```tsx
import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  START_WEIGHT_KG, GOAL_WEIGHT_KG, TOTAL_DAYS, PROGRAMME_END,
} from '../lib/constants'
import {
  getDayNumber, getWorkoutForDate, isSunday, getProgrammeState,
} from '../lib/dateUtils'
import {
  getPaceBanner, getProjectedEndWeight,
  isStallAlert, getMealCompliance, getCurrentStreak,
  getWorkoutCompletionPct, getWeeklyLossRate, getExpectedWeight,
} from '../lib/computations'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import type { DailyLog, Meal } from '../types'

// Pace badge styles (inline pill inside hero card)
const PACE_BADGE: Record<string, React.CSSProperties> = {
  'on-track': { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.30)', color: '#4ade80' },
  'slightly-behind': { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)', color: '#fbbf24' },
  'behind': { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444' },
}

// Pace banner styles (full-width card below hero)
const PACE_BANNER: Record<string, React.CSSProperties> = {
  'on-track': { background: 'rgba(74,222,128,0.06)', boxShadow: '0 0 0 1px rgba(74,222,128,0.4), 0 0 16px rgba(74,222,128,0.15)' },
  'slightly-behind': { background: 'rgba(251,191,36,0.06)', boxShadow: '0 0 0 1px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.15)' },
  'behind': { background: 'rgba(239,68,68,0.06)', boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 0 16px rgba(239,68,68,0.15)' },
}

const PACE_DOT: Record<string, string> = {
  'on-track': '#4ade80',
  'slightly-behind': '#fbbf24',
  'behind': '#ef4444',
}

const PACE_TEXT: Record<string, string> = {
  'on-track': 'On Track',
  'slightly-behind': 'Slightly Behind',
  'behind': 'Behind',
}

// Stagger variants for stats grid
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const programmeState = getProgrammeState(today)
  const dayNumber = getDayNumber(today)
  const workout = getWorkoutForDate(today)

  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: logsData, error: logsErr }, { data: mealsData, error: mealsErr }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date'),
        supabase.from('meals').select('*'),
      ])
      if (logsErr || mealsErr) {
        setLoadError('Failed to load data — check your connection')
        setLoading(false)
        return
      }
      const allLogs: DailyLog[] = logsData ?? []
      setLogs(allLogs)
      setMeals(mealsData ?? [])
      setTodayLog(allLogs.find((l) => l.log_date === today) ?? null)
      setLoading(false)
    }
    load()
  }, [today])

  // SVG ring progress — set up before early returns (hook rules)
  const progress = Math.min(dayNumber / 33, 1)
  const ringOffset = useMotionValue(314)
  useEffect(() => {
    const controls = animate(ringOffset, (1 - progress) * 314, {
      type: 'spring',
      stiffness: 60,
      damping: 18,
    })
    return () => controls.stop()
  }, [progress]) // ringOffset is a stable MotionValue ref, safe to omit

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'rgba(255,255,255,0.40)' }}>
      Loading…
    </div>
  )
  if (loadError) return (
    <div style={{ color: '#f87171', padding: 16 }}>{loadError}</div>
  )

  const weightLogs = logs.filter((l) => l.weight_kg !== null)
  const latestWeight = weightLogs.at(-1)?.weight_kg ?? null
  const totalLost = latestWeight !== null ? START_WEIGHT_KG - latestWeight : null
  const mealCompliance = getMealCompliance(meals)
  const workoutPct = getWorkoutCompletionPct(logs, today)
  const streak = getCurrentStreak(logs, meals)
  const weeklyRate = getWeeklyLossRate(logs, today)

  const showPace = latestWeight !== null && programmeState === 'active'
  const pace = showPace ? getPaceBanner(latestWeight!, dayNumber) : null
  const projected = latestWeight !== null
    ? getProjectedEndWeight(latestWeight, weightLogs.length, today)
    : null

  const stall = isStallAlert(logs)

  const chartData = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1
    const target = parseFloat(getExpectedWeight(day).toFixed(2))
    const logForDay = logs.find((l) => getDayNumber(l.log_date) === day)
    return { day, target, actual: logForDay?.weight_kg ?? null }
  })

  const showWorkoutCard = !(
    (isSunday(today) && !todayLog) ||
    todayLog?.workout_status === 'rest'
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.40)', marginBottom: 4 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Good morning
          </h1>
        </div>

        {/* Hero card — day + ring */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Left: day number + pace badge + projected */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                style={{
                  fontSize: 80,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  lineHeight: 1,
                  display: 'block',
                  background: 'linear-gradient(135deg, #a855f7, #f5a623)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {dayNumber}
              </motion.span>
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.25)' }}>/ 33</span>
            </div>

            {/* Pace badge */}
            {pace && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                marginTop: 8,
                ...PACE_BADGE[pace],
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: PACE_DOT[pace],
                  display: 'inline-block',
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
                {PACE_TEXT[pace]}
              </div>
            )}

            {projected !== null && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                Projected: {projected.toFixed(2)} kg by {format(parseISO(PROGRAMME_END), 'MMMM d')}
              </p>
            )}
          </div>

          {/* Right: SVG ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" width="120" height="120">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f5a623" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="314"
                style={{ strokeDashoffset: ringOffset, transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700, fontSize: 18, color: '#fff',
            }}>
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        {/* Stats grid — staggered entrance */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
          className="lg:grid-cols-3"
        >
          {[
            { label: 'Current Weight', value: latestWeight, unit: 'kg', highlight: true, icon: '⚖️' },
            { label: 'Total Lost', value: totalLost, unit: 'kg', icon: '📉' },
            { label: 'Meal Compliance', value: mealCompliance, unit: '%', icon: '🍽️' },
            { label: 'Workout Completion', value: workoutPct, unit: '%', icon: '💪' },
            { label: 'Current Streak', value: streak, unit: 'days', icon: '🔥' },
            { label: 'Weekly Loss Rate', value: weeklyRate, unit: 'kg/wk', icon: '📊' },
          ].map((props) => (
            <motion.div key={props.label} variants={cardVariants}>
              <StatCard {...props} />
            </motion.div>
          ))}
        </motion.div>

        {/* Pace banner */}
        {showPace && pace && (
          <div style={{
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            ...PACE_BANNER[pace],
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: PACE_DOT[pace],
              flexShrink: 0,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <div>
              <p style={{ fontWeight: 600, margin: 0, color: PACE_DOT[pace] }}>{PACE_TEXT[pace]}</p>
              {projected !== null && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: '2px 0 0' }}>
                  Projected weight on {format(parseISO(PROGRAMME_END), 'MMMM d')}: <strong>{projected.toFixed(2)} kg</strong>{' '}
                  (goal: {GOAL_WEIGHT_KG} kg)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stall alert */}
        {stall && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.04))',
            border: '1px solid rgba(245,166,35,0.20)',
            borderRadius: 20,
            padding: '16px 20px',
          }}>
            <p style={{ color: '#f5a623', fontWeight: 600, marginBottom: 8 }}>⚠️ Weight Stall Detected</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 8 }}>Your weight hasn't changed in 3+ entries. Try:</p>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              style={{ paddingLeft: 16, margin: 0 }}
            >
              {[
                'Reduce fruit intake — natural sugars may be stalling fat loss',
                'Add an extra 20-min walk tomorrow',
                'Check sleep — aim for 7–8 hours',
              ].map((tip) => (
                <motion.li
                  key={tip}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200 } } }}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}
                >
                  {tip}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )}

        {/* Weight trend chart */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '20px 16px',
        }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            Weight Trend
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.12)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
              <YAxis
                domain={[Math.floor(GOAL_WEIGHT_KG) - 2, Math.ceil(START_WEIGHT_KG) + 2]}
                stroke="rgba(255,255,255,0.12)"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,8,20,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  backdropFilter: 'blur(20px)',
                }}
                labelFormatter={(l) => `Day ${l}`}
              />
              <ReferenceLine y={GOAL_WEIGHT_KG} stroke="#f5a623" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#f5a623', fontSize: 11 }} />
              <Line type="monotone" dataKey="target" stroke="#f5a623" strokeDasharray="3 3" dot={false} strokeOpacity={0.4} />
              <Line type="monotone" dataKey="actual" stroke="#f5a623" dot={{ fill: '#f5a623', r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Today's workout card */}
        {showWorkoutCard && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,166,35,0.06))',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '20px 24px',
          }}>
            <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
              Today's Workout — {workout.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workout.exercises.map((ex, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>{ex.name}</span>
                  <span style={{ fontSize: 14, fontFamily: "'Space Mono', monospace", color: '#f5a623' }}>{ex.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

> **Note on `lg:grid-cols-3`:** The stats grid uses `style` for 2-column layout and Tailwind class for 3-column on large screens. This mixing is fine in Vite + Tailwind — Tailwind's responsive utilities override the `style` grid template on `lg:` breakpoints because Tailwind uses `!important` in some utilities, but CSS specificity may cause issues. If `lg:grid-cols-3` doesn't override the inline style, move `gridTemplateColumns` entirely to Tailwind: remove the inline `style` prop for `gridTemplateColumns` and use `className="grid grid-cols-2 lg:grid-cols-3"` instead. Keep `gap` and other non-grid properties in `style`.

- [ ] **Step 2: Verify TypeScript and tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, 46 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: redesign Dashboard with SVG ring hero, gradient header, stagger stats, glass cards, pace badge"
```

---

## Task 8: Redesign CheckIn Page

**Files:**
- Modify: `src/pages/CheckIn.tsx`

All data-fetching logic, `emptyForm`, `logToForm`, `handleSave`, and state are preserved exactly. Only the JSX structure changes. `className` inputs are replaced with `className="glass-input"`.

- [ ] **Step 1: Replace the JSX return in `src/pages/CheckIn.tsx`**

Keep everything above line 132 (`return (`) unchanged. Replace from `return (` to end of file with:

```tsx
  if (loadError) return <div style={{ color: '#f87171', padding: 16 }}>{loadError}</div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Daily Check-in
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px' }}>{today}</p>
        </div>

        {/* Weight */}
        <section style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Weight</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 81.20"
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              className="glass-input"
              style={{ width: 160 }}
            />
            <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>kg</span>
          </div>
          {weightDelta !== null && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, marginTop: 8, fontWeight: 500, color: weightDelta < 0 ? '#4ade80' : '#f87171' }}
            >
              {weightDelta < 0 ? '−' : '+'}{Math.abs(weightDelta).toFixed(2)} kg from start
            </motion.p>
          )}
        </section>

        {/* Meals */}
        <section style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Meals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MEAL_TYPES.map((t) => (
              <div key={t}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{MEAL_LABELS[t]}</label>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => setForm({
                      ...form,
                      meals: { ...form.meals, [t]: { ...form.meals[t], on_plan: !form.meals[t].on_plan } },
                    })}
                    style={{
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      ...(form.meals[t].on_plan
                        ? { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }
                        : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }),
                    }}
                  >
                    {form.meals[t].on_plan ? '✅ On Plan' : '❌ Off Plan'}
                  </motion.button>
                </div>
                <textarea
                  rows={2}
                  placeholder="What did you eat?"
                  value={form.meals[t].description}
                  onChange={(e) => setForm({
                    ...form,
                    meals: { ...form.meals, [t]: { ...form.meals[t], description: e.target.value } },
                  })}
                  className="glass-input"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Workout */}
        <section style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Workout</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {WORKOUT_STATUSES.map((s) => {
              const active = form.workout_status === s
              return (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => setForm({ ...form, workout_status: s })}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    ...(active
                      ? { background: 'linear-gradient(135deg, #7c3aed, #f5a623)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.10)' }),
                  }}
                >
                  {s}
                </motion.button>
              )
            })}
          </div>
          <textarea
            rows={2}
            placeholder="Notes (optional)"
            value={form.workout_notes}
            onChange={(e) => setForm({ ...form, workout_notes: e.target.value })}
            className="glass-input"
          />
        </section>

        {/* Wellness */}
        <section style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Wellness</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>Water (ml)</label>
              <input
                type="number"
                value={form.water_ml}
                onChange={(e) => setForm({ ...form, water_ml: e.target.value })}
                className="glass-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                value={form.sleep_hours}
                onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
                className="glass-input"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <StarRating label="Energy" value={form.energy} onChange={(v) => setForm({ ...form, energy: v })} />
            <StarRating label="Hunger" value={form.hunger} onChange={(v) => setForm({ ...form, hunger: v })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>Soreness / Notes</label>
            <textarea
              rows={2}
              value={form.soreness_notes}
              onChange={(e) => setForm({ ...form, soreness_notes: e.target.value })}
              className="glass-input"
            />
          </div>
        </section>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
            border: 'none',
            borderRadius: 16,
            color: 'white',
            fontWeight: 700,
            fontSize: 15,
            padding: '14px 0',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving…' : "Save Today's Check-in"}
        </motion.button>

      </div>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

Also add to imports at the top of the file (after existing imports):

```tsx
import { motion, AnimatePresence } from 'framer-motion'
```

- [ ] **Step 2: Verify TypeScript and tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, 46 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CheckIn.tsx
git commit -m "feat: redesign CheckIn with glass sections, amber focus inputs, spring buttons, gradient save"
```

---

## Task 9: Redesign History + Measurements Pages

**Files:**
- Modify: `src/pages/History.tsx`
- Modify: `src/pages/Measurements.tsx`

- [ ] **Step 1: Replace JSX return in `src/pages/History.tsx`**

Keep all data-fetching logic (lines 1–52) unchanged. Add to imports: `import { motion, AnimatePresence } from 'framer-motion'`.

Replace from `return (` to end of file:

```tsx
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          History
        </h1>

        {/* Summary bar — 6 mini glass tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="lg:grid-cols-3">
          {[
            { label: 'Days Logged', value: String(logs.length) },
            { label: 'Meal Compliance', value: compliance !== null ? `${compliance}%` : '—' },
            { label: 'Workouts Done', value: String(workoutsDone) },
            { label: 'Avg Water', value: logs.filter(l => l.water_ml).length ? `${Math.round(avgWater)} ml` : '—' },
            { label: 'Avg Sleep', value: logs.filter(l => l.sleep_hours).length ? `${avgSleep.toFixed(1)} h` : '—' },
            { label: 'Current Streak', value: `${streak} days` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 12 }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", margin: 0, color: '#fff' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Daily log table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', padding: '16px 20px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Daily Log
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Day', 'Weight', 'Meals', 'Workout', 'Water', 'Sleep', 'Energy'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {logs.map((log) => {
                  const dayMeals = mealsByDate.get(log.log_date) ?? []
                  const onPlan = dayMeals.filter(m => m.on_plan).length
                  return (
                    <motion.tr
                      key={log.log_date}
                      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#fff' }}>{formatDate(log.log_date)}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{getDayNumber(log.log_date)}</td>
                      <td style={{ padding: '10px 16px', color: '#f5a623', fontFamily: "'Space Mono', monospace" }}>{log.weight_kg?.toFixed(2) ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{dayMeals.length ? `${onPlan}/${dayMeals.length}` : '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{log.workout_status ? STATUS_LABEL[log.workout_status] : '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{log.water_ml ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{log.sleep_hours ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{log.energy ? '★'.repeat(log.energy) : '—'}</td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
            {logs.length === 0 && (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)' }}>No entries yet</p>
            )}
          </div>
        </div>

        {/* Meal detail table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', padding: '16px 20px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Meal Detail
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Meal', 'Description', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {meals.map((meal, i) => (
                  <motion.tr
                    key={meal.id ?? i}
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: !meal.on_plan ? 'rgba(239,68,68,0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#fff' }}>{formatDate(meal.log_date)}</td>
                    <td style={{ padding: '10px 16px', textTransform: 'capitalize', color: 'rgba(255,255,255,0.60)' }}>{meal.meal_type}</td>
                    <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.60)' }}>{meal.description}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: meal.on_plan ? '#4ade80' : '#f87171' }}>
                      {meal.on_plan ? '✅ On Plan' : '❌ Off Plan'}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
            {meals.length === 0 && (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)' }}>No meals logged yet</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
```

> **Note on Toast in History:** History is a read-only page with no save actions, so it has no `toast` state and does not render `<Toast>`. The spec lists History among "four pages that use it", but since there is no user-triggered mutation in History, adding a Toast here would be dead code. This omission is intentional — no `AnimatePresence` or `Toast` needed in History.

> **Note on `motion.tbody` / `motion.tr`:** Framer Motion supports `motion.tbody` and `motion.tr`. If TypeScript complains about unknown motion elements, cast with `const MotionTbody = motion.tbody` and use `<MotionTbody>` instead.

- [ ] **Step 2: Replace JSX return in `src/pages/Measurements.tsx`**

Keep all data-fetching, `canSave`, `handleSave`, `deltaVal`, and state unchanged. Add to imports: `import { motion, AnimatePresence } from 'framer-motion'`.

Replace from `return (` to end of file:

```tsx
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Measurements
        </h1>

        {/* Entry form */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Log Measurements</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input"
              style={{ width: 'auto' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Waist (cm)', value: waist, set: setWaist },
              { label: 'Chest (cm)', value: chest, set: setChest },
              { label: 'Arm (cm)', value: arm, set: setArm },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>{label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="glass-input"
                />
              </div>
            ))}
          </div>
          <motion.button
            onClick={handleSave}
            disabled={!canSave || saving}
            whileHover={{ scale: canSave ? 1.01 : 1 }}
            whileTap={{ scale: canSave ? 0.98 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
              border: 'none',
              borderRadius: 16,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 0',
              cursor: !canSave || saving ? 'not-allowed' : 'pointer',
              opacity: !canSave || saving ? 0.4 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save Measurements'}
          </motion.button>
        </div>

        {/* History table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', padding: '16px 20px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Measurement History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Waist', 'Chest', 'Arm', 'Δ Waist', 'Δ Chest', 'Δ Arm'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((m) => (
                  <tr
                    key={m.measured_at}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#fff' }}>{formatDate(m.measured_at)}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.waist_cm}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.chest_cm}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.arm_cm}</td>
                    {first ? (
                      <>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.waist_cm <= first.waist_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.waist_cm, first.waist_cm)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.chest_cm <= first.chest_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.chest_cm, first.chest_cm)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.arm_cm >= first.arm_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.arm_cm, first.arm_cm)}
                        </td>
                      </>
                    ) : (
                      <><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)' }}>No measurements yet</p>
            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript and all tests**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: Zero errors, all 46 tests pass.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/History.tsx src/pages/Measurements.tsx
git commit -m "feat: redesign History and Measurements with glass tables, stagger rows, gradient headers"
```

---

## Final Verification

After all 9 tasks complete:

- [ ] `npm test -- --run` → 46/46 pass
- [ ] `npm run build` → succeeds
- [ ] `npm run dev` → open `http://localhost:5173`
  - Login page: mesh orbs visible, glass card, gradient title
  - Dashboard: animated SVG ring, count-up stats, pace badge, stagger entrance
  - Check-in: glass sections, amber focus on inputs, spring buttons
  - History: stagger rows, glass tables
  - Measurements: glass form, gradient save
  - Mobile (resize to <1024px): bottom tab bar visible, sidebar hidden
  - Desktop (≥1024px): sidebar visible, bottom tab bar hidden
  - Page transitions: spring fade when switching sections
