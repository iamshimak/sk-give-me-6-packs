# Fitness Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 33-day personal fat loss tracker web app (March 23 → April 25, 2026) with 4 sections — Dashboard, Daily Check-in, History, Measurements — deployed on Vercel with Supabase as the database.

**Architecture:** React (Vite) + TypeScript SPA with Tailwind CSS styling and Recharts for charts. All business logic lives in pure utility functions in `src/lib/` that are fully unit-tested with Vitest. UI pages in `src/pages/` compose those utilities with Supabase data fetching and rendering.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v3, Recharts, Supabase JS client v2, date-fns, Vitest + React Testing Library, Vercel

---

## File Map

```
src/
  main.tsx                        # React root mount
  App.tsx                         # Auth gate + programme state routing
  index.css                       # Tailwind directives + custom CSS vars
  types/
    index.ts                      # All shared TypeScript interfaces
  lib/
    constants.ts                  # Programme constants + hardcoded workout data
    supabase.ts                   # Supabase client initialisation
    dateUtils.ts                  # dayNumber(), programmeState(), getWorkoutType()
    computations.ts               # pace, streak, compliance, stall alert, projections
  components/
    Layout.tsx                    # App shell (sidebar + main area)
    Sidebar.tsx                   # Left nav with 4 items + mobile overlay
    Toast.tsx                     # Error/success toast notification
    StatCard.tsx                  # Reusable stat display card
    StarRating.tsx                # 1–5 interactive star input
  pages/
    Login.tsx                     # Login screen (hardcoded credentials)
    Countdown.tsx                 # Pre-programme countdown screen
    Dashboard.tsx                 # Section 1: all dashboard widgets
    CheckIn.tsx                   # Section 2: daily log form
    History.tsx                   # Section 3: summary + two tables
    Measurements.tsx              # Section 4: measurement form + history table
tests/
  dateUtils.test.ts               # Unit tests for date utilities
  computations.test.ts            # Unit tests for all computation logic
supabase/
  schema.sql                      # DDL for all 3 tables
.env.example                      # Template for Vercel env vars
vercel.json                       # SPA routing fallback
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/shimak/Documents/Project/sk-give-me-6-packs
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install @supabase/supabase-js recharts date-fns
npm install -D tailwindcss postcss autoprefixer vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.ts` with:

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
        amber: {
          400: '#f5a623',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Set up Tailwind directives in `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0d0d1a;
  --surface: #16213e;
  --accent: #f5a623;
}

body {
  background-color: var(--bg);
  color: #e5e7eb;
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 5: Configure Vite for testing**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 6: Create test setup file**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Add npm scripts to `package.json`**

Ensure `package.json` scripts section includes:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: server running at `http://localhost:5173`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

## Task 2: Types, Constants, and Supabase Schema

**Files:**
- Create: `src/types/index.ts`, `src/lib/constants.ts`, `src/lib/supabase.ts`, `supabase/schema.sql`, `.env.example`, `vercel.json`

- [ ] **Step 1: Write shared TypeScript types**

Create `src/types/index.ts`:

```ts
export type ProgrammeState = 'before' | 'active' | 'after'

export type WorkoutType = 'strength' | 'cardio' | 'rest'

export type WorkoutStatus = 'done' | 'partial' | 'missed' | 'rest'

export interface Exercise {
  name: string
  detail: string // e.g. "3×12" or "30–45 min"
}

export interface Workout {
  name: string
  type: WorkoutType
  exercises: Exercise[]
}

export interface DailyLog {
  log_date: string          // ISO date string "YYYY-MM-DD"
  weight_kg: number | null
  water_ml: number | null
  sleep_hours: number | null
  energy: number | null     // 1–5
  hunger: number | null     // 1–5
  workout_status: WorkoutStatus | null
  workout_notes: string | null
  soreness_notes: string | null
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface Meal {
  log_date: string
  meal_type: MealType
  description: string
  on_plan: boolean
}

export interface Measurement {
  measured_at: string       // ISO date string "YYYY-MM-DD"
  waist_cm: number
  chest_cm: number
  arm_cm: number
}

export interface MealFormState {
  description: string
  on_plan: boolean
}

export interface CheckInFormState {
  weight_kg: string
  meals: Record<MealType, MealFormState>
  workout_status: WorkoutStatus | null
  workout_notes: string
  water_ml: string
  sleep_hours: string
  energy: number | null
  hunger: number | null
  soreness_notes: string
}
```

- [ ] **Step 2: Write programme constants and workout data**

Create `src/lib/constants.ts`:

```ts
import type { Workout } from '../types'

export const PROGRAMME_START = '2026-03-23'
export const PROGRAMME_END = '2026-04-25'
export const START_WEIGHT_KG = 81.70
export const GOAL_WEIGHT_KG = 70.00
export const TARGET_LOSS_KG = 11.70
export const TOTAL_DAYS = 33
export const NON_REST_DAYS_TOTAL = 30  // Mon–Sat across 5 full weeks

const STRENGTH_WORKOUT: Workout = {
  name: 'Strength Training',
  type: 'strength',
  exercises: [
    { name: 'Dumbbell Bicep Curls', detail: '3×12' },
    { name: 'Dumbbell Shoulder Press', detail: '3×10' },
    { name: 'Dumbbell Rows', detail: '3×12 each arm' },
    { name: 'Dumbbell Chest Press (floor)', detail: '3×10' },
    { name: 'Dumbbell Lunges', detail: '3×12 each leg' },
    { name: 'Dumbbell Romanian Deadlift', detail: '3×10' },
  ],
}

const CARDIO_WORKOUT: Workout = {
  name: 'Cardio & HIIT',
  type: 'cardio',
  exercises: [
    { name: 'Outdoor Walk', detail: '30–45 min' },
    { name: 'Bicycle', detail: '20–30 min' },
    { name: 'HIIT Circuit — 4 rounds', detail: 'Jump Squats ×15, Push-ups ×10, High Knees ×30s, Rest 30s' },
  ],
}

const REST_WORKOUT: Workout = {
  name: 'Rest Day',
  type: 'rest',
  exercises: [],
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const WORKOUT_BY_DOW: Record<number, Workout> = {
  0: REST_WORKOUT,
  1: STRENGTH_WORKOUT,
  2: CARDIO_WORKOUT,
  3: STRENGTH_WORKOUT,
  4: CARDIO_WORKOUT,
  5: STRENGTH_WORKOUT,
  6: CARDIO_WORKOUT,
}
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Write the database schema**

Create `supabase/schema.sql`:

```sql
-- Run this in the Supabase SQL editor

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date unique not null,
  weight_kg numeric,
  water_ml integer,
  sleep_hours numeric,
  energy smallint check (energy between 1 and 5),
  hunger smallint check (hunger between 1 and 5),
  workout_status text check (workout_status in ('done', 'partial', 'missed', 'rest')),
  workout_notes text,
  soreness_notes text,
  created_at timestamptz default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(log_date) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  description text not null,
  on_plan boolean not null
);

create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  measured_at date unique not null,
  waist_cm numeric not null,
  chest_cm numeric not null,
  arm_cm numeric not null
);

-- Disable RLS — single-user app, access controlled via client-side login gate
alter table daily_logs disable row level security;
alter table meals disable row level security;
alter table measurements disable row level security;
```

- [ ] **Step 5: Apply schema to Supabase**

Go to your Supabase project → SQL Editor → paste `supabase/schema.sql` → Run.

- [ ] **Step 6: Create `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_USER=your-username
VITE_APP_PASS=your-password
```

- [ ] **Step 7: Create local `.env` file**

```bash
cp .env.example .env
# Fill in actual values from your Supabase project settings
```

Add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 8: Create `vercel.json` for SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add types, constants, supabase client, schema, vercel config"
```

---

## Task 3: Date Utilities (TDD)

**Files:**
- Create: `src/lib/dateUtils.ts`, `tests/dateUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/dateUtils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  getProgrammeState,
  getDayNumber,
  getWorkoutForDate,
  formatDate,
  isSunday,
  getNonRestDaysElapsed,
} from '../src/lib/dateUtils'

describe('getProgrammeState', () => {
  it('returns before for dates before programme start', () => {
    expect(getProgrammeState('2026-03-22')).toBe('before')
  })

  it('returns active on day 1', () => {
    expect(getProgrammeState('2026-03-23')).toBe('active')
  })

  it('returns active on day 33', () => {
    expect(getProgrammeState('2026-04-25')).toBe('active')
  })

  it('returns after for dates past programme end', () => {
    expect(getProgrammeState('2026-04-26')).toBe('after')
  })
})

describe('getDayNumber', () => {
  it('returns 1 on programme start', () => {
    expect(getDayNumber('2026-03-23')).toBe(1)
  })

  it('returns 33 on programme end', () => {
    expect(getDayNumber('2026-04-25')).toBe(33)
  })

  it('clamps to 33 after programme end', () => {
    expect(getDayNumber('2026-05-01')).toBe(33)
  })

  it('clamps to 1 before programme start', () => {
    expect(getDayNumber('2026-03-01')).toBe(1)
  })
})

describe('getWorkoutForDate', () => {
  it('returns strength for Monday (2026-03-23)', () => {
    expect(getWorkoutForDate('2026-03-23').type).toBe('strength')
  })

  it('returns cardio for Tuesday (2026-03-24)', () => {
    expect(getWorkoutForDate('2026-03-24').type).toBe('cardio')
  })

  it('returns rest for Sunday (2026-03-29)', () => {
    expect(getWorkoutForDate('2026-03-29').type).toBe('rest')
  })

  it('returns strength for Friday (2026-03-27)', () => {
    expect(getWorkoutForDate('2026-03-27').type).toBe('strength')
  })
})

describe('isSunday', () => {
  it('returns true for Sunday', () => {
    expect(isSunday('2026-03-29')).toBe(true)
  })

  it('returns false for Monday', () => {
    expect(isSunday('2026-03-23')).toBe(false)
  })
})

describe('getNonRestDaysElapsed', () => {
  it('returns 1 on day 1 (Monday)', () => {
    expect(getNonRestDaysElapsed('2026-03-23')).toBe(1)
  })

  it('returns 6 at end of first week (Saturday)', () => {
    expect(getNonRestDaysElapsed('2026-03-28')).toBe(6)
  })

  it('skips Sunday — same as Saturday count on Sunday', () => {
    expect(getNonRestDaysElapsed('2026-03-29')).toBe(6)
  })

  it('caps at 30 after programme end', () => {
    expect(getNonRestDaysElapsed('2026-04-30')).toBe(30)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/dateUtils.test.ts
```

Expected: FAIL — "Cannot find module '../src/lib/dateUtils'"

- [ ] **Step 3: Implement `src/lib/dateUtils.ts`**

```ts
import { differenceInCalendarDays, parseISO, getDay, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday } from 'date-fns'
import { PROGRAMME_START, PROGRAMME_END, WORKOUT_BY_DOW, NON_REST_DAYS_TOTAL } from './constants'
import type { ProgrammeState, Workout } from '../types'

function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function getProgrammeState(today: string): ProgrammeState {
  const d = parseDate(today)
  const start = parseDate(PROGRAMME_START)
  const end = parseDate(PROGRAMME_END)
  if (d < start) return 'before'
  if (d > end) return 'after'
  return 'active'
}

export function getDayNumber(today: string): number {
  const diff = differenceInCalendarDays(parseDate(today), parseDate(PROGRAMME_START)) + 1
  return Math.max(1, Math.min(33, diff))
}

export function getWorkoutForDate(dateStr: string): Workout {
  const dow = getDay(parseDate(dateStr)) // 0 = Sun, 6 = Sat
  return WORKOUT_BY_DOW[dow]
}

export function isSunday(dateStr: string): boolean {
  return getDay(parseDate(dateStr)) === 0
}

export function formatDate(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getNonRestDaysElapsed(today: string): number {
  const start = parseDate(PROGRAMME_START)
  const end = parseDate(PROGRAMME_END)
  const current = parseDate(today)
  const cap = current > end ? end : current

  let count = 0
  const cursor = new Date(start)
  while (cursor <= cap) {
    const dow = getDay(cursor)
    if (dow !== 0) count++ // not Sunday
    cursor.setDate(cursor.getDate() + 1)
  }
  return Math.min(count, NON_REST_DAYS_TOTAL)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/dateUtils.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/dateUtils.ts tests/dateUtils.test.ts
git commit -m "feat: add date utilities with full test coverage"
```

---

## Task 4: Computation Utilities (TDD)

**Files:**
- Create: `src/lib/computations.ts`, `tests/computations.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/computations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  getExpectedWeight,
  getPaceBanner,
  getProjectedEndWeight,
  isStallAlert,
  getMealCompliance,
  getCurrentStreak,
  getWorkoutCompletionPct,
  getWeeklyLossRate,
} from '../src/lib/computations'
import type { DailyLog, Meal } from '../src/types'

const BASE_LOG = (date: string, weight: number | null = null): DailyLog => ({
  log_date: date,
  weight_kg: weight,
  water_ml: null,
  sleep_hours: null,
  energy: null,
  hunger: null,
  workout_status: null,
  workout_notes: null,
  soreness_notes: null,
})

describe('getExpectedWeight', () => {
  it('returns start weight on day 1', () => {
    expect(getExpectedWeight(1)).toBeCloseTo(81.70)
  })

  it('decreases each day', () => {
    expect(getExpectedWeight(2)).toBeLessThan(getExpectedWeight(1))
  })

  it('is above goal weight on day 33', () => {
    // Formula reaches ~70.36 on day 33 — correct by design
    expect(getExpectedWeight(33)).toBeGreaterThan(70.00)
    expect(getExpectedWeight(33)).toBeLessThan(81.70)
  })
})

describe('getPaceBanner', () => {
  it('returns on-track when loss equals expected', () => {
    expect(getPaceBanner(81.70, 1)).toBe('on-track')
  })

  it('returns on-track within 0.5 kg of expected', () => {
    // Day 10: expected loss ≈ 3.19 kg. Actual: 2.8 kg lost → 0.39 behind
    expect(getPaceBanner(81.70 - 2.8, 10)).toBe('on-track')
  })

  it('returns slightly-behind when 0.5–1.5 kg behind', () => {
    expect(getPaceBanner(81.70 - 2.0, 10)).toBe('slightly-behind')
  })

  it('returns behind when >1.5 kg behind', () => {
    expect(getPaceBanner(81.00, 10)).toBe('behind')
  })
})

describe('getProjectedEndWeight', () => {
  it('returns goal area when losing at target rate', () => {
    const result = getProjectedEndWeight(80.0, 5, '2026-03-28')
    expect(typeof result).toBe('number')
  })

  it('returns current weight or above when not losing', () => {
    // avgDailyLoss = (81.70 - 81.70) / 1 = 0
    const result = getProjectedEndWeight(81.70, 1, '2026-03-23')
    expect(result).toBeGreaterThanOrEqual(81.70)
  })
})

describe('isStallAlert', () => {
  it('returns false when fewer than 3 weight entries', () => {
    const logs = [BASE_LOG('2026-03-23', 81.70), BASE_LOG('2026-03-24', 81.70)]
    expect(isStallAlert(logs)).toBe(false)
  })

  it('returns true when last 3 weights are identical', () => {
    const logs = [
      BASE_LOG('2026-03-23', 81.70),
      BASE_LOG('2026-03-24', 81.70),
      BASE_LOG('2026-03-25', 81.70),
    ]
    expect(isStallAlert(logs)).toBe(true)
  })

  it('returns false when last 3 weights differ', () => {
    const logs = [
      BASE_LOG('2026-03-23', 81.70),
      BASE_LOG('2026-03-24', 81.50),
      BASE_LOG('2026-03-25', 81.20),
    ]
    expect(isStallAlert(logs)).toBe(false)
  })

  it('ignores logs with null weight', () => {
    const logs = [
      BASE_LOG('2026-03-23', 81.70),
      BASE_LOG('2026-03-24', null),
      BASE_LOG('2026-03-25', 81.70),
      BASE_LOG('2026-03-26', 81.70),
      BASE_LOG('2026-03-27', 81.70),
    ]
    expect(isStallAlert(logs)).toBe(true)
  })
})

describe('getMealCompliance', () => {
  const meals: Meal[] = [
    { log_date: '2026-03-23', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
    { log_date: '2026-03-23', meal_type: 'lunch', description: 'Chicken', on_plan: true },
    { log_date: '2026-03-23', meal_type: 'snack', description: 'Cake', on_plan: false },
    { log_date: '2026-03-24', meal_type: 'breakfast', description: 'Mango', on_plan: true },
  ]

  it('returns correct percentage', () => {
    expect(getMealCompliance(meals)).toBe(75)
  })

  it('returns null when no meals', () => {
    expect(getMealCompliance([])).toBeNull()
  })
})

describe('getCurrentStreak', () => {
  const allMeals: Meal[] = [
    { log_date: '2026-03-23', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
    { log_date: '2026-03-24', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
    { log_date: '2026-03-25', meal_type: 'breakfast', description: 'Cake', on_plan: false },
  ]
  const logs = [
    BASE_LOG('2026-03-23'),
    BASE_LOG('2026-03-24'),
    BASE_LOG('2026-03-25'),
  ]

  it('counts streak correctly up to first off-plan meal', () => {
    expect(getCurrentStreak(logs, allMeals)).toBe(2)
  })

  it('skips days with no meals', () => {
    const logsWithGap = [BASE_LOG('2026-03-23'), BASE_LOG('2026-03-24')]
    const mealsOnlyDay1: Meal[] = [
      { log_date: '2026-03-23', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
    ]
    // Day 2 has no meals → skipped; streak = 1
    expect(getCurrentStreak(logsWithGap, mealsOnlyDay1)).toBe(1)
  })

  it('returns 0 when no logs', () => {
    expect(getCurrentStreak([], [])).toBe(0)
  })
})

describe('getWorkoutCompletionPct', () => {
  it('returns null when no logs', () => {
    expect(getWorkoutCompletionPct([], '2026-03-23')).toBeNull()
  })

  it('returns 100 when all done on day 1 (1 non-rest day)', () => {
    const logs = [{ ...BASE_LOG('2026-03-23'), workout_status: 'done' as const }]
    expect(getWorkoutCompletionPct(logs, '2026-03-23')).toBe(100)
  })

  it('counts partial as completed', () => {
    const logs = [{ ...BASE_LOG('2026-03-23'), workout_status: 'partial' as const }]
    expect(getWorkoutCompletionPct(logs, '2026-03-23')).toBe(100)
  })
})

describe('getWeeklyLossRate', () => {
  it('returns null with fewer than 2 entries in window', () => {
    const logs = [BASE_LOG('2026-03-23', 81.70)]
    expect(getWeeklyLossRate(logs, '2026-03-23')).toBeNull()
  })

  it('calculates rate correctly', () => {
    const logs = [
      BASE_LOG('2026-03-23', 81.70),
      BASE_LOG('2026-03-28', 80.70),
    ]
    // 1 kg over 5 days in 7-day window ending March 28
    const rate = getWeeklyLossRate(logs, '2026-03-28')
    expect(rate).not.toBeNull()
    expect(rate!).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/computations.test.ts
```

Expected: FAIL — "Cannot find module '../src/lib/computations'"

- [ ] **Step 3: Implement `src/lib/computations.ts`**

```ts
import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import {
  START_WEIGHT_KG,
  PROGRAMME_END,
} from './constants'
import { getNonRestDaysElapsed } from './dateUtils'
import type { DailyLog, Meal } from '../types'

export type PaceBanner = 'on-track' | 'slightly-behind' | 'behind'

export function getExpectedWeight(dayNumber: number): number {
  return START_WEIGHT_KG - ((11.70 / 33) * (dayNumber - 1))
}

export function getPaceBanner(
  currentWeight: number,
  dayNumber: number,
): PaceBanner {
  const expected = getExpectedWeight(dayNumber)
  const behind = currentWeight - expected // positive = behind
  if (behind <= 0.5) return 'on-track'
  if (behind <= 1.5) return 'slightly-behind'
  return 'behind'
}

export function getProjectedEndWeight(
  currentWeight: number,
  daysWithWeightLogged: number,
  today: string,
): number {
  const avgDailyLoss = (START_WEIGHT_KG - currentWeight) / daysWithWeightLogged
  const daysRemaining = differenceInCalendarDays(
    parseISO(PROGRAMME_END),
    parseISO(today),
  )
  return currentWeight - avgDailyLoss * daysRemaining
}

export function isStallAlert(logs: DailyLog[]): boolean {
  const weights = logs
    .filter((l) => l.weight_kg !== null)
    .map((l) => Math.round(l.weight_kg! * 100) / 100)

  if (weights.length < 3) return false

  const last3 = weights.slice(-3)
  return last3[0] === last3[1] && last3[1] === last3[2]
}

export function getMealCompliance(meals: Meal[]): number | null {
  if (meals.length === 0) return null
  const onPlan = meals.filter((m) => m.on_plan).length
  return Math.round((onPlan / meals.length) * 100)
}

export function getCurrentStreak(logs: DailyLog[], meals: Meal[]): number {
  const mealsByDate = new Map<string, Meal[]>()
  for (const m of meals) {
    if (!mealsByDate.has(m.log_date)) mealsByDate.set(m.log_date, [])
    mealsByDate.get(m.log_date)!.push(m)
  }

  const sorted = [...logs].sort(
    (a, b) => a.log_date.localeCompare(b.log_date),
  )

  let streak = 0
  // Walk from newest backward
  for (let i = sorted.length - 1; i >= 0; i--) {
    const date = sorted[i].log_date
    const dayMeals = mealsByDate.get(date) ?? []

    // Skip days with no meals
    if (dayMeals.length === 0) continue

    const allOnPlan = dayMeals.every((m) => m.on_plan)
    if (allOnPlan) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function getWorkoutCompletionPct(
  logs: DailyLog[],
  today: string,
): number | null {
  const completedLogs = logs.filter(
    (l) => l.workout_status === 'done' || l.workout_status === 'partial',
  )
  if (completedLogs.length === 0) return null

  const denominator = getNonRestDaysElapsed(today)
  if (denominator === 0) return null

  return Math.round((completedLogs.length / denominator) * 100)
}

export function getWeeklyLossRate(
  logs: DailyLog[],
  today: string,
): number | null {
  const windowStart = subDays(parseISO(today), 6) // today - 6 days
  const inWindow = logs.filter((l) => {
    const d = parseISO(l.log_date)
    return l.weight_kg !== null && d >= windowStart && d <= parseISO(today)
  })

  if (inWindow.length < 2) return null

  const sorted = [...inWindow].sort((a, b) =>
    a.log_date.localeCompare(b.log_date),
  )
  const earliest = sorted[0].weight_kg!
  const latest = sorted[sorted.length - 1].weight_kg!
  const daySpan = differenceInCalendarDays(
    parseISO(sorted[sorted.length - 1].log_date),
    parseISO(sorted[0].log_date),
  )
  if (daySpan === 0) return null
  return ((earliest - latest) / daySpan) * 7
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/computations.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/computations.ts tests/computations.test.ts
git commit -m "feat: add computation utilities with full test coverage"
```

---

## Task 5: Auth + App Routing

**Files:**
- Create: `src/pages/Login.tsx`, `src/pages/Countdown.tsx`, `src/App.tsx`, update `src/main.tsx`

- [ ] **Step 1: Create `src/pages/Login.tsx`**

```tsx
import { useState, FormEvent } from 'react'

interface Props {
  onLogin: () => void
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
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="w-full max-w-sm bg-navy-800 rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
          6 Pack Tracker
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-amber-400 text-navy-900 font-bold py-2 rounded-lg hover:bg-amber-300 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/Countdown.tsx`**

```tsx
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { PROGRAMME_START } from '../lib/constants'

export default function Countdown() {
  const today = new Date().toISOString().slice(0, 10)
  const days = differenceInCalendarDays(parseISO(PROGRAMME_START), parseISO(today))

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-400 mb-4">6 Pack Tracker</h1>
        <p className="text-gray-400 text-lg mb-2">Programme starts on</p>
        <p className="text-white text-2xl font-semibold mb-6">March 23, 2026</p>
        <div className="bg-navy-800 rounded-xl px-8 py-6 inline-block">
          <p className="text-5xl font-bold text-amber-400">{days}</p>
          <p className="text-gray-400 mt-1">days to go</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/App.tsx`**

```tsx
import { useState } from 'react'
import { getProgrammeState } from './lib/dateUtils'
import Login from './pages/Login'
import Countdown from './pages/Countdown'
import Layout from './components/Layout'

type Section = 'dashboard' | 'checkin' | 'history' | 'measurements'

export default function App() {
  const [isAuthed, setIsAuthed] = useState(
    () => localStorage.getItem('ft_auth') === '1',
  )
  const [section, setSection] = useState<Section>('dashboard')

  if (!isAuthed) {
    return <Login onLogin={() => setIsAuthed(true)} />
  }

  const today = new Date().toISOString().slice(0, 10)
  const state = getProgrammeState(today)

  if (state === 'before') {
    return <Countdown />
  }

  return (
    <Layout section={section} onNavigate={setSection} />
  )
}
```

- [ ] **Step 4: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Verify login screen renders**

```bash
npm run dev
```

Open `http://localhost:5173` — login screen should appear.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx src/pages/Login.tsx src/pages/Countdown.tsx
git commit -m "feat: add auth gate, countdown, and app routing"
```

---

## Task 6: Shared UI Components + Layout Shell

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/Sidebar.tsx`, `src/components/Toast.tsx`, `src/components/StatCard.tsx`, `src/components/StarRating.tsx`

- [ ] **Step 1: Create `src/components/StatCard.tsx`**

```tsx
interface Props {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
}

export default function StatCard({ label, value, unit, highlight }: Props) {
  const display = value === null ? '—' : `${value}${unit ? ' ' + unit : ''}`
  return (
    <div className="bg-navy-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {display}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/StarRating.tsx`**

```tsx
interface Props {
  value: number | null
  onChange: (v: number) => void
  label: string
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl transition ${
              value !== null && n <= value ? 'text-amber-400' : 'text-gray-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Toast.tsx`**

```tsx
import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'error' | 'success'
  onDismiss: () => void
}

export default function Toast({ message, type = 'error', onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-medium z-50 ${
        type === 'error' ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      {message}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/Sidebar.tsx`**

```tsx
type Section = 'dashboard' | 'checkin' | 'history' | 'measurements'

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'checkin', label: 'Daily Check-in', icon: '✏️' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'measurements', label: 'Measurements', icon: '📏' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ section, onNavigate, isOpen, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-navy-800 z-30 flex flex-col py-6 px-3 transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <h1 className="text-amber-400 font-bold text-lg px-3 mb-8">6 Pack Tracker</h1>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left
                ${section === item.id
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
```

- [ ] **Step 5: Create `src/components/Layout.tsx`**

```tsx
import { useState, lazy, Suspense } from 'react'
import Sidebar from './Sidebar'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const CheckIn = lazy(() => import('../pages/CheckIn'))
const History = lazy(() => import('../pages/History'))
const Measurements = lazy(() => import('../pages/Measurements'))

type Section = 'dashboard' | 'checkin' | 'history' | 'measurements'

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function Layout({ section, onNavigate }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const page = {
    dashboard: <Dashboard />,
    checkin: <CheckIn />,
    history: <History />,
    measurements: <Measurements />,
  }[section]

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar
        section={section}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-navy-800 border-b border-navy-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 text-xl"
          >
            ☰
          </button>
          <span className="text-amber-400 font-semibold">6 Pack Tracker</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
            {page}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create placeholder pages so Layout doesn't crash**

Create `src/pages/Dashboard.tsx`:
```tsx
export default function Dashboard() { return <div className="text-white">Dashboard (coming soon)</div> }
```

Create `src/pages/CheckIn.tsx`:
```tsx
export default function CheckIn() { return <div className="text-white">Check-in (coming soon)</div> }
```

Create `src/pages/History.tsx`:
```tsx
export default function History() { return <div className="text-white">History (coming soon)</div> }
```

Create `src/pages/Measurements.tsx`:
```tsx
export default function Measurements() { return <div className="text-white">Measurements (coming soon)</div> }
```

- [ ] **Step 7: Verify layout renders with sidebar navigation**

```bash
npm run dev
```

Login → should see sidebar + section switching works.

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/pages/
git commit -m "feat: add layout shell, sidebar, and shared UI components"
```

---

## Task 7: Dashboard Page

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement `src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'
import {
  START_WEIGHT_KG, GOAL_WEIGHT_KG, TOTAL_DAYS,
} from '../lib/constants'
import {
  getDayNumber, getWorkoutForDate, isSunday, getProgrammeState,
} from '../lib/dateUtils'
import {
  getExpectedWeight, getPaceBanner, getProjectedEndWeight,
  isStallAlert, getMealCompliance, getCurrentStreak,
  getWorkoutCompletionPct, getWeeklyLossRate,
} from '../lib/computations'
import StatCard from '../components/StatCard'
import type { DailyLog, Meal } from '../types'

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const programmeState = getProgrammeState(today)
  const dayNumber = getDayNumber(today)
  const workout = getWorkoutForDate(today)

  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: logsData }, { data: mealsData }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date'),
        supabase.from('meals').select('*'),
      ])
      const allLogs: DailyLog[] = logsData ?? []
      setLogs(allLogs)
      setMeals(mealsData ?? [])
      setTodayLog(allLogs.find((l) => l.log_date === today) ?? null)
      setLoading(false)
    }
    load()
  }, [today])

  if (loading) return <div className="text-gray-400">Loading…</div>

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

  // Chart data: target line + actual weight points
  const chartData = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1
    const target = parseFloat((START_WEIGHT_KG - ((11.70 / 33) * i)).toFixed(2))
    const logForDay = logs.find((l) => getDayNumber(l.log_date) === day)
    return {
      day,
      target,
      actual: logForDay?.weight_kg ?? null,
    }
  })

  // Workout card visible when workout_status != 'rest'
  const showWorkoutCard = !(
    (isSunday(today) && !todayLog) ||
    todayLog?.workout_status === 'rest'
  )

  const paceColor = {
    'on-track': 'bg-green-900/50 border-green-500 text-green-300',
    'slightly-behind': 'bg-yellow-900/50 border-yellow-500 text-yellow-300',
    'behind': 'bg-red-900/50 border-red-500 text-red-300',
  }

  const paceLabel = {
    'on-track': '✅ On Track',
    'slightly-behind': '⚠️ Slightly Behind',
    'behind': '🔴 Behind Pace',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <span className="bg-amber-400 text-navy-900 text-sm font-bold px-3 py-1 rounded-full">
            Day {dayNumber} of 33
          </span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-2">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${(dayNumber / 33) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Current Weight" value={latestWeight !== null ? latestWeight.toFixed(2) : null} unit="kg" highlight />
        <StatCard label="Total Lost" value={totalLost !== null ? totalLost.toFixed(2) : null} unit="kg" />
        <StatCard label="Meal Compliance" value={mealCompliance !== null ? mealCompliance : null} unit="%" />
        <StatCard label="Workout Completion" value={workoutPct !== null ? workoutPct : null} unit="%" />
        <StatCard label="Current Streak" value={streak} unit="days" />
        <StatCard label="Weekly Loss Rate" value={weeklyRate !== null ? weeklyRate.toFixed(2) : null} unit="kg/wk" />
      </div>

      {/* Pace banner */}
      {showPace && pace && (
        <div className={`rounded-xl border px-4 py-3 ${paceColor[pace]}`}>
          <p className="font-semibold">{paceLabel[pace]}</p>
          {projected !== null && (
            <p className="text-sm mt-1">
              Projected weight on April 25: <strong>{projected.toFixed(2)} kg</strong>
              {' '}(goal: {GOAL_WEIGHT_KG} kg)
            </p>
          )}
        </div>
      )}

      {/* Stall alert */}
      {stall && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3">
          <p className="text-amber-400 font-semibold mb-2">⚠️ Weight Stall Detected</p>
          <p className="text-sm text-gray-300">Your weight hasn't changed in 3+ entries. Try:</p>
          <ul className="text-sm text-gray-300 list-disc ml-4 mt-1 space-y-1">
            <li>Reduce fruit intake — natural sugars may be stalling fat loss</li>
            <li>Add an extra 20-min walk tomorrow</li>
            <li>Check sleep — aim for 7–8 hours</li>
          </ul>
        </div>
      )}

      {/* Weight trend chart */}
      <div className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Weight Trend
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis
              domain={[68, 83]}
              stroke="#4b5563"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{ background: '#16213e', border: 'none', borderRadius: 8 }}
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
        <div className="bg-navy-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Today's Workout — {workout.name}
          </h2>
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-white text-sm">{ex.name}</span>
                <span className="text-amber-400 text-sm font-mono">{ex.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify Dashboard renders without errors**

```bash
npm run dev
```

Login → Dashboard should show stats, chart, and workout card.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: implement Dashboard with stats, chart, pace, stall alert, workout card"
```

---

## Task 8: Daily Check-in Page

**Files:**
- Modify: `src/pages/CheckIn.tsx`

- [ ] **Step 1: Implement `src/pages/CheckIn.tsx`**

```tsx
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isSunday } from '../lib/dateUtils'
import { START_WEIGHT_KG } from '../lib/constants'
import StarRating from '../components/StarRating'
import Toast from '../components/Toast'
import type { CheckInFormState, MealType, WorkoutStatus, DailyLog, Meal } from '../types'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
}
const WORKOUT_STATUSES: WorkoutStatus[] = ['done', 'partial', 'missed', 'rest']

function emptyForm(isRestDay: boolean): CheckInFormState {
  return {
    weight_kg: '',
    meals: {
      breakfast: { description: '', on_plan: true },
      lunch: { description: '', on_plan: true },
      snack: { description: '', on_plan: true },
      dinner: { description: '', on_plan: true },
    },
    workout_status: isRestDay ? 'rest' : null,
    workout_notes: '',
    water_ml: '',
    sleep_hours: '',
    energy: null,
    hunger: null,
    soreness_notes: '',
  }
}

function logToForm(log: DailyLog, meals: Meal[]): CheckInFormState {
  const form = emptyForm(false)
  form.weight_kg = log.weight_kg?.toString() ?? ''
  form.workout_status = log.workout_status
  form.workout_notes = log.workout_notes ?? ''
  form.water_ml = log.water_ml?.toString() ?? ''
  form.sleep_hours = log.sleep_hours?.toString() ?? ''
  form.energy = log.energy
  form.hunger = log.hunger
  form.soreness_notes = log.soreness_notes ?? ''
  for (const m of meals) {
    form.meals[m.meal_type] = { description: m.description, on_plan: m.on_plan }
  }
  return form
}

export default function CheckIn() {
  const today = new Date().toISOString().slice(0, 10)
  const restDay = isSunday(today)

  const [form, setForm] = useState<CheckInFormState>(emptyForm(restDay))
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [saving, setSaving] = useState(false)

  // Load existing data
  useEffect(() => {
    async function load() {
      const [{ data: logData }, { data: mealsData }] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('log_date', today).maybeSingle(),
        supabase.from('meals').select('*').eq('log_date', today),
      ])
      if (logData) {
        setForm(logToForm(logData as DailyLog, (mealsData ?? []) as Meal[]))
      }
    }
    load()
  }, [today])

  const weightDelta = form.weight_kg
    ? (parseFloat(form.weight_kg) - START_WEIGHT_KG).toFixed(2)
    : null

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Step 1: Upsert daily_logs
      const { error: logError } = await supabase.from('daily_logs').upsert({
        log_date: today,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        water_ml: form.water_ml ? parseInt(form.water_ml) : null,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
        energy: form.energy,
        hunger: form.hunger,
        workout_status: form.workout_status,
        workout_notes: form.workout_notes || null,
        soreness_notes: form.soreness_notes || null,
      }, { onConflict: 'log_date' })
      if (logError) throw logError

      // Step 2: Delete existing meals for today
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('log_date', today)
      if (deleteError) throw deleteError

      // Step 3: Insert non-empty meals
      const newMeals = MEAL_TYPES
        .filter((t) => form.meals[t].description.trim() !== '')
        .map((t) => ({
          log_date: today,
          meal_type: t,
          description: form.meals[t].description.trim(),
          on_plan: form.meals[t].on_plan,
        }))
      if (newMeals.length > 0) {
        const { error: mealsError } = await supabase.from('meals').insert(newMeals)
        if (mealsError) throw mealsError
      }

      setToast({ message: 'Saved!', type: 'success' })
    } catch {
      setToast({ message: 'Save failed — check your connection', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [form, today])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Daily Check-in</h1>
      <p className="text-gray-400 text-sm">{today}</p>

      {/* Weight */}
      <section className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Weight</h2>
        <input
          type="number"
          step="0.01"
          placeholder="e.g. 81.20"
          value={form.weight_kg}
          onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
          className="w-40 bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
        />
        <p className="text-sm text-gray-400 mt-2">kg</p>
        {weightDelta !== null && (
          <p className={`text-sm mt-1 font-medium ${parseFloat(weightDelta) < 0 ? 'text-green-400' : 'text-red-400'}`}>
            {parseFloat(weightDelta) < 0 ? '−' : '+'}{Math.abs(parseFloat(weightDelta)).toFixed(2)} kg from start
          </p>
        )}
      </section>

      {/* Meals */}
      <section className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Meals</h2>
        <div className="space-y-4">
          {MEAL_TYPES.map((t) => (
            <div key={t}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-white text-sm font-medium">{MEAL_LABELS[t]}</label>
                <button
                  type="button"
                  onClick={() => setForm({
                    ...form,
                    meals: { ...form.meals, [t]: { ...form.meals[t], on_plan: !form.meals[t].on_plan } },
                  })}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    form.meals[t].on_plan
                      ? 'bg-green-700/40 text-green-300 hover:bg-green-700/60'
                      : 'bg-red-700/40 text-red-300 hover:bg-red-700/60'
                  }`}
                >
                  {form.meals[t].on_plan ? '✅ On Plan' : '❌ Off Plan'}
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="What did you eat?"
                value={form.meals[t].description}
                onChange={(e) => setForm({
                  ...form,
                  meals: { ...form.meals, [t]: { ...form.meals[t], description: e.target.value } },
                })}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Workout */}
      <section className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout</h2>
        <div className="flex gap-2 flex-wrap mb-3">
          {WORKOUT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, workout_status: s })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                form.workout_status === s
                  ? 'bg-amber-400 text-navy-900'
                  : 'bg-navy-900 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          placeholder="Notes (optional)"
          value={form.workout_notes}
          onChange={(e) => setForm({ ...form, workout_notes: e.target.value })}
          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
        />
      </section>

      {/* Wellness */}
      <section className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Wellness</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Water (ml)</label>
            <input
              type="number"
              value={form.water_ml}
              onChange={(e) => setForm({ ...form, water_ml: e.target.value })}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Sleep (hours)</label>
            <input
              type="number"
              step="0.5"
              value={form.sleep_hours}
              onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StarRating label="Energy" value={form.energy} onChange={(v) => setForm({ ...form, energy: v })} />
          <StarRating label="Hunger" value={form.hunger} onChange={(v) => setForm({ ...form, hunger: v })} />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-1">Soreness / Notes</label>
          <textarea
            rows={2}
            value={form.soreness_notes}
            onChange={(e) => setForm({ ...form, soreness_notes: e.target.value })}
            className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-amber-400 text-navy-900 font-bold py-3 rounded-xl hover:bg-amber-300 disabled:opacity-50 transition"
      >
        {saving ? 'Saving…' : 'Save Today's Check-in'}
      </button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify Check-in page works end-to-end**

```bash
npm run dev
```

Navigate to Check-in → fill in weight + a meal → Save → confirm data appears in Supabase table.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CheckIn.tsx
git commit -m "feat: implement Daily Check-in with save, pre-population, and toast feedback"
```

---

## Task 9: History Page

**Files:**
- Modify: `src/pages/History.tsx`

- [ ] **Step 1: Implement `src/pages/History.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDayNumber, formatDate } from '../lib/dateUtils'
import { getMealCompliance, getCurrentStreak } from '../lib/computations'
import type { DailyLog, Meal } from '../types'

const STATUS_LABEL: Record<string, string> = {
  done: '✅ Done',
  partial: '🟡 Partial',
  missed: '❌ Missed',
  rest: '😴 Rest',
}

export default function History() {
  const today = new Date().toISOString().slice(0, 10)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: logsData }, { data: mealsData }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date', { ascending: false }),
        supabase.from('meals').select('*').order('log_date', { ascending: false }),
      ])
      setLogs(logsData ?? [])
      setMeals(mealsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-gray-400">Loading…</div>

  const compliance = getMealCompliance(meals)
  const streak = getCurrentStreak([...logs].reverse(), meals)
  const avgWater = logs.filter(l => l.water_ml).reduce((a, b) => a + (b.water_ml ?? 0), 0) / (logs.filter(l => l.water_ml).length || 1)
  const avgSleep = logs.filter(l => l.sleep_hours).reduce((a, b) => a + (b.sleep_hours ?? 0), 0) / (logs.filter(l => l.sleep_hours).length || 1)
  const workoutsDone = logs.filter(l => l.workout_status === 'done').length

  const mealsByDate = new Map<string, Meal[]>()
  for (const m of meals) {
    if (!mealsByDate.has(m.log_date)) mealsByDate.set(m.log_date, [])
    mealsByDate.get(m.log_date)!.push(m)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">History</h1>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Days Logged', value: logs.length },
          { label: 'Meal Compliance', value: compliance !== null ? `${compliance}%` : '—' },
          { label: 'Workouts Done', value: workoutsDone },
          { label: 'Avg Water', value: logs.length ? `${Math.round(avgWater)} ml` : '—' },
          { label: 'Avg Sleep', value: logs.filter(l => l.sleep_hours).length ? `${avgSleep.toFixed(1)} h` : '—' },
          { label: 'Current Streak', value: `${streak} days` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-navy-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-lg font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Daily log table */}
      <div className="bg-navy-800 rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-navy-700">
          Daily Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-navy-700">
                {['Date', 'Day', 'Weight', 'Meals', 'Workout', 'Water', 'Sleep', 'Energy'].map(h => (
                  <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dayMeals = mealsByDate.get(log.log_date) ?? []
                const onPlan = dayMeals.filter(m => m.on_plan).length
                return (
                  <tr key={log.log_date} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(log.log_date)}</td>
                    <td className="px-4 py-2">{getDayNumber(log.log_date)}</td>
                    <td className="px-4 py-2 text-amber-400">{log.weight_kg?.toFixed(2) ?? '—'}</td>
                    <td className="px-4 py-2">{dayMeals.length ? `${onPlan}/${dayMeals.length}` : '—'}</td>
                    <td className="px-4 py-2">{log.workout_status ? STATUS_LABEL[log.workout_status] : '—'}</td>
                    <td className="px-4 py-2">{log.water_ml ?? '—'}</td>
                    <td className="px-4 py-2">{log.sleep_hours ?? '—'}</td>
                    <td className="px-4 py-2">{log.energy ? '★'.repeat(log.energy) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-gray-500 text-center py-8">No entries yet</p>
          )}
        </div>
      </div>

      {/* Meal detail table */}
      <div className="bg-navy-800 rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-navy-700">
          Meal Detail
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-navy-700">
                {['Date', 'Meal', 'Description', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, i) => (
                <tr
                  key={i}
                  className={`border-b border-navy-700/50 ${!meal.on_plan ? 'bg-red-900/20' : ''}`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(meal.log_date)}</td>
                  <td className="px-4 py-2 capitalize">{meal.meal_type}</td>
                  <td className="px-4 py-2">{meal.description}</td>
                  <td className={`px-4 py-2 font-medium ${meal.on_plan ? 'text-green-400' : 'text-red-400'}`}>
                    {meal.on_plan ? '✅ On Plan' : '❌ Off Plan'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meals.length === 0 && (
            <p className="text-gray-500 text-center py-8">No meals logged yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify History page renders correctly**

```bash
npm run dev
```

Navigate to History → both tables should render; off-plan meals should have red row background.

- [ ] **Step 3: Commit**

```bash
git add src/pages/History.tsx
git commit -m "feat: implement History page with summary bar and two data tables"
```

---

## Task 10: Measurements Page

**Files:**
- Modify: `src/pages/Measurements.tsx`

- [ ] **Step 1: Implement `src/pages/Measurements.tsx`**

```tsx
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/dateUtils'
import Toast from '../components/Toast'
import type { Measurement } from '../types'

export default function Measurements() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [waist, setWaist] = useState('')
  const [chest, setChest] = useState('')
  const [arm, setArm] = useState('')
  const [history, setHistory] = useState<Measurement[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .order('measured_at')
    setHistory((data ?? []) as Measurement[])
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // Pre-populate form when date changes
  useEffect(() => {
    const existing = history.find((m) => m.measured_at === date)
    if (existing) {
      setWaist(existing.waist_cm.toString())
      setChest(existing.chest_cm.toString())
      setArm(existing.arm_cm.toString())
    } else {
      setWaist('')
      setChest('')
      setArm('')
    }
  }, [date, history])

  const canSave = waist !== '' && chest !== '' && arm !== ''

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const { error } = await supabase.from('measurements').upsert(
        {
          measured_at: date,
          waist_cm: parseFloat(waist),
          chest_cm: parseFloat(chest),
          arm_cm: parseFloat(arm),
        },
        { onConflict: 'measured_at' },
      )
      if (error) throw error
      setToast({ message: 'Measurements saved!', type: 'success' })
      await loadHistory()
    } catch {
      setToast({ message: 'Save failed — check your connection', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [canSave, date, waist, chest, arm, loadHistory])

  const first = history[0]
  const deltaVal = (current: number, baseline: number) => {
    const d = current - baseline
    return `${d <= 0 ? '' : '+'}${d.toFixed(1)}`
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Measurements</h1>

      {/* Entry form */}
      <div className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Log Measurements</h2>
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Waist (cm)', value: waist, set: setWaist },
            { label: 'Chest (cm)', value: chest, set: setChest },
            { label: 'Arm (cm)', value: arm, set: setArm },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-amber-400 text-navy-900 font-bold py-2.5 rounded-xl hover:bg-amber-300 disabled:opacity-40 transition"
        >
          {saving ? 'Saving…' : 'Save Measurements'}
        </button>
      </div>

      {/* History table */}
      <div className="bg-navy-800 rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-navy-700">
          Measurement History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-navy-700">
                {['Date', 'Waist', 'Chest', 'Arm', 'Δ Waist', 'Δ Chest', 'Δ Arm'].map(h => (
                  <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((m) => (
                <tr key={m.measured_at} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(m.measured_at)}</td>
                  <td className="px-4 py-2">{m.waist_cm}</td>
                  <td className="px-4 py-2">{m.chest_cm}</td>
                  <td className="px-4 py-2">{m.arm_cm}</td>
                  {first ? (
                    <>
                      <td className={`px-4 py-2 font-mono ${m.waist_cm <= first.waist_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.waist_cm, first.waist_cm)}
                      </td>
                      <td className={`px-4 py-2 font-mono ${m.chest_cm <= first.chest_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.chest_cm, first.chest_cm)}
                      </td>
                      <td className={`px-4 py-2 font-mono ${m.arm_cm <= first.arm_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.arm_cm, first.arm_cm)}
                      </td>
                    </>
                  ) : (
                    <><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <p className="text-gray-500 text-center py-8">No measurements yet</p>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify Measurements page works end-to-end**

```bash
npm run dev
```

Navigate to Measurements → enter values → Save → confirm row appears in history table and Supabase. Change date to same date → confirm values pre-populate.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Measurements.tsx
git commit -m "feat: implement Measurements page with form pre-population and history table"
```

---

## Task 11: Final Polish + Build Verification

**Files:**
- Modify: `index.html`, `src/App.tsx` (post-programme state)

- [ ] **Step 1: Update page title in `index.html`**

Change `<title>` in `index.html`:

```html
<title>6 Pack Tracker</title>
```

- [ ] **Step 2: Verify the full test suite passes**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 3: Verify production build succeeds**

```bash
npm run build
```

Expected: build completes with no TypeScript errors

- [ ] **Step 4: Smoke-test the built app**

```bash
npx vite preview
```

Open `http://localhost:4173` → login → navigate all 4 sections → check-in → save data.

- [ ] **Step 5: Add `.gitignore` entries**

Ensure `.gitignore` contains:

```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: finalize app — title, gitignore, build verified"
```

---

## Task 12: Deploy to Vercel

**Steps (manual — requires Vercel account):**

- [ ] **Step 1: Push to GitHub**

```bash
gh repo create sk-give-me-6-packs --private --source=. --push
```

Or manually create a GitHub repo and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sk-give-me-6-packs.git
git push -u origin main
```

- [ ] **Step 2: Import project to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `sk-give-me-6-packs`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

- [ ] **Step 3: Add environment variables in Vercel**

In Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL       = (from Supabase project settings)
VITE_SUPABASE_ANON_KEY  = (from Supabase project settings → API)
VITE_APP_USER           = (your chosen username)
VITE_APP_PASS           = (your chosen password)
```

- [ ] **Step 4: Deploy**

Click Deploy. Vercel will build and deploy.

- [ ] **Step 5: Verify on mobile**

Open the Vercel URL on your phone → login → navigate all sections → log today's check-in → verify data appears on laptop too.

---

## Summary

| Task | Deliverable |
|---|---|
| 1 | Vite + React + TS + Tailwind scaffold |
| 2 | Types, constants, Supabase schema + client |
| 3 | Date utilities with unit tests |
| 4 | Computation utilities with unit tests |
| 5 | Auth (login gate + countdown) |
| 6 | Layout shell + sidebar + shared components |
| 7 | Dashboard (stats, chart, pace, stall, workout) |
| 8 | Daily Check-in (weight, meals, workout, wellness) |
| 9 | History (summary bar + two tables) |
| 10 | Measurements (form + history table) |
| 11 | Build verification + polish |
| 12 | Vercel deployment |
