# Fitness Tracker — Design Spec
**Date:** 2026-03-22
**Programme:** 33-day fat loss, March 23 → April 25, 2026
**Starting weight:** 81.70 kg | **Goal weight:** 70.00 kg | **Target loss:** 11.70 kg

---

## Overview

A personal web-based fitness tracker for a 33-day fat loss programme. Cross-device (mobile + desktop), password-gated with hardcoded credentials, no user registration flow. Data persists in Supabase; frontend deployed on Vercel.

---

## Programme Constants

| Constant | Value |
|---|---|
| `PROGRAMME_START` | 2026-03-23 (Monday = Day 1) |
| `PROGRAMME_END` | 2026-04-25 (Day 33) |
| `START_WEIGHT_KG` | 81.70 |
| `GOAL_WEIGHT_KG` | 70.00 |
| `TARGET_LOSS_KG` | 11.70 |
| `TOTAL_DAYS` | 33 |
| `TARGET_DAILY_LOSS_KG` | `11.70 / 33` (use the division expression in code; do not round to 0.355) |

Day number is computed as: `dayNumber = differenceInDays(today, PROGRAMME_START) + 1`, clamped to 1–33. This formula is only evaluated when the app is in the active programme state (see below).

**App state outside the programme window:**
- **Before Day 1 (today < 2026-03-23):** Show a full-screen "Programme starts on March 23, 2026" countdown screen. All 4 nav sections are inaccessible. No `dayNumber` is computed.
- **Active (2026-03-23 ≤ today ≤ 2026-04-25):** Normal operation. `dayNumber` is computed and clamped to 1–33.
- **After Day 33 (today > 2026-04-25):** The app operates normally — all sections remain fully readable and the Daily Check-in remains usable. `dayNumber` is fixed at 33; the day badge is frozen at "Day 33 of 33" and the progress bar at 100%. Pace banner is hidden (programme is over).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend / DB | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Theme | Dark navy background (`#0d0d1a`), amber accent (`#f5a623`) |
| Navigation | Left sidebar (collapses to hamburger on mobile) |

---

## Authentication

- Hardcoded username + password stored as Vercel environment variables (`VITE_APP_USER`, `VITE_APP_PASS`)
- Simple client-side check on the login screen; credentials are bundled into the JS build (visible in browser devtools). This is an accepted trade-off for a personal, private deployment — no sensitive data beyond fitness logs is at risk.
- On incorrect password: display the message "Incorrect username or password" below the form fields. Field values are preserved. No retry limit.
- Successful login writes a flag to `localStorage`; the app reads it on load to skip the login gate
- Both mobile and desktop visit the same Vercel URL and log in once per device
- No explicit logout button — the session persists until the user clears localStorage manually. This is intentional for a personal, single-user app.

---

## Database Schema (Supabase)

### `daily_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| log_date | date UNIQUE | one row per day; upsert key |
| weight_kg | numeric | nullable |
| water_ml | integer | nullable |
| sleep_hours | numeric | nullable |
| energy | smallint | 1–5, nullable |
| hunger | smallint | 1–5, nullable |
| workout_status | text | done / partial / missed / rest |
| workout_notes | text | nullable |
| soreness_notes | text | nullable |
| created_at | timestamptz | DEFAULT now() |

### `meals`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| log_date | date | FK → daily_logs.log_date |
| meal_type | text | breakfast / lunch / snack / dinner |
| description | text | |
| on_plan | boolean | |

Save strategy: delete all existing rows for `log_date`, then insert fresh rows for each meal card with a non-empty description. No upsert key is needed — delete-then-insert is the sole strategy. Meals with empty descriptions are not inserted and do not count toward the compliance denominator.

### `measurements`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| measured_at | date UNIQUE | upsert key; replaces all columns on conflict |
| waist_cm | numeric NOT NULL | |
| chest_cm | numeric NOT NULL | |
| arm_cm | numeric NOT NULL | |

All three measurement fields are required. The save button is disabled unless all three are filled. If a DB-level NOT NULL constraint violation occurs despite the client-side guard, show the same toast error ("Save failed — check your connection") — the constraint serves as defence-in-depth.

No `session_id` needed — single-user app.

**Supabase access policy:** Row Level Security (RLS) is **disabled** on all three tables (`daily_logs`, `meals`, `measurements`). The Supabase anon key has unrestricted read/write access. This is intentional — the app uses its own client-side login gate rather than Supabase Auth. The Supabase project should be kept private (not shared publicly) as the only protection layer.

---

## Navigation

Left sidebar with 4 items:
1. Dashboard
2. Daily Check-in
3. History
4. Measurements

On mobile: sidebar collapses; hamburger button in header opens it as an overlay.

---

## Section 1 — Dashboard

**Header:** "Day X of 33" badge + horizontal progress bar

**Stats grid (6 cards):**
- Current Weight (kg) — most recent logged weight; display "—" if no weight logged yet
- Total Weight Lost (kg) — START_WEIGHT_KG minus most recent weight; display "—" if no weight logged yet
- Meal Compliance % — `onPlanMeals ÷ totalLoggedMeals × 100`; display "—" if no meals logged yet
- Workout Completion % — see Progress Logic for exact formula; display "—" before any workout logs exist
- Current Streak — most recent unbroken run of consecutive logged days where every logged meal is on-plan; display "0" if streak is broken or no logs exist
- Weekly Loss Rate (kg/week) — weight loss over the 7-day window ending on the current calendar date (regardless of whether today is logged). Computed as: (earliest logged weight in window) − (latest logged weight in window), expressed as kg/week. Window is always anchored to today. Display "—" if fewer than 2 weight entries exist within the last 7 calendar days.

**Pace banner:** Hidden if no weight has been logged yet, or if the programme is over (after Day 33). When visible:
- Green — On Track (actual cumulative loss within 0.5 kg of expected)
- Yellow — Slightly Behind (0.5–1.5 kg behind expected)
- Red — Behind Pace (>1.5 kg behind expected)
- Always shows: projected weight on April 25 at current rate

**Stall alert:** Amber warning card shown when weight is unchanged across the 3 most recent log entries (gaps in logging are irrelevant — only log entry order matters, not calendar dates). "Unchanged" means the `weight_kg` value, rounded to 2 decimal places, is exactly equal across those entries. Suggested corrective actions:
1. Reduce fruit intake (natural sugars may be stalling fat loss)
2. Add an extra 20-min walk tomorrow
3. Check sleep — aim for 7–8 hours

**Weight trend chart (Recharts LineChart):**
- X-axis: Day 1–33
- Actual weight line (amber) — plotted only for logged days; if no data exists, show an empty chart with axes and the target line only
- Dashed target reference line from 81.70 kg (Day 1) to 70.00 kg (Day 33)

**Today's workout card:** Shows workout name and exercise list (sets × reps or duration). Visibility rules (checked in order):
1. If today is Sunday AND no `daily_logs` row exists for today → card is hidden (no saved status to override the default yet)
2. If a `daily_logs` row exists and `workout_status = 'rest'` → card is hidden
3. Otherwise (non-Sunday with no row, or any day with status ≠ rest) → card is shown

---

## Workout Schedule

Workout type is derived from the **calendar day-of-week** of the current date (not from the day number). Day 1 = March 23, 2026 = Monday = Strength, which is consistent with the schedule below.

### Strength (Mon / Wed / Fri)
1. Dumbbell Bicep Curls — 3×12
2. Dumbbell Shoulder Press — 3×10
3. Dumbbell Rows — 3×12 each arm
4. Dumbbell Chest Press (floor) — 3×10
5. Dumbbell Lunges — 3×12 each leg
6. Dumbbell Romanian Deadlift — 3×10

### Cardio & HIIT (Tue / Thu / Sat)
1. Outdoor Walk — 30–45 min
2. Bicycle — 20–30 min
3. HIIT Circuit — 4 rounds:
   - Jump Squats × 15
   - Push-ups × 10
   - High Knees × 30s
   - Rest 30s

### Rest (Sun)
- No workout card shown on the Dashboard
- On the Daily Check-in, the workout status buttons (Done / Partial / Missed / Rest) are shown and pre-selected to **Rest**, but the user may override this selection if desired

---

## Section 2 — Daily Check-in

**Weight log:**
- Number input (kg, 2 decimal places)
- Delta display below: "−X.XX kg from start" (computed vs START_WEIGHT_KG)

**Meal log (4 cards):** Breakfast, Lunch, Snack, Dinner
- Text area for description
- Toggle button: On Plan (green) / Off Plan (red); defaults to On Plan
- A meal card is only saved to the DB if the description field is non-empty

**Workout log:**
- 4-button group: Done / Partial / Missed / Rest
- On Sundays, **Rest** is pre-selected; user may change it
- On non-Sunday days (first visit, no prior log), no button is pre-selected — user must choose one
- Text area for notes

**Wellness log:**
- Water intake (ml) — number input
- Sleep (hours) — number input
- Energy — 1–5 star rating
- Hunger — 1–5 star rating
- Soreness / extra notes — text area

**Form load behaviour:** When the user opens Daily Check-in, the app fetches the existing `daily_logs` row and all `meals` rows for today's date. If data exists, all fields are pre-populated with the saved values. If no row exists, the form starts empty (except workout status on Sundays, which defaults to Rest).

**Save button — operation order (must be sequential):**
1. Upsert `daily_logs` row for today's date (must complete successfully before proceeding)
2. Delete all existing `meals` rows for today's date
3. Insert fresh `meals` rows for each meal card with a non-empty description

This ordering ensures the FK constraint (`meals.log_date → daily_logs.log_date`) is never violated on first save. On any Supabase write failure at any step, show a toast error ("Save failed — check your connection") and keep the form data intact for retry. No silent failures.

---

## Section 3 — History

**Summary bar:**
- Total days logged
- Overall meal compliance % (same formula as Dashboard; show "—" if zero)
- Workouts completed (count of `workout_status = 'done'`)
- Average daily water (ml)
- Average sleep (hours)
- Current streak — same value as Dashboard stat card: most recent unbroken run of consecutive logged days where every logged meal is on-plan

**Table 1 — Daily log:**
Columns: Date · Day# · Weight · Meal Score (e.g. 3/4 = logged meals that are on-plan / total logged meals for that day) · Workout · Water · Sleep · Energy

Day# computed from `PROGRAMME_START`.

**Table 2 — Meal detail:**
Columns: Date · Meal · Description · Status
Off-plan rows highlighted in red.

Both tables sorted newest → oldest.

---

## Section 4 — Measurements

**Form load behaviour:** When the user selects a date in the entry form, the app checks for an existing `measurements` row for that date. If found, the three fields are pre-populated with the saved values (edit mode). If not found, the fields are empty (new entry mode).

**Entry form:**
- Waist (cm), Chest (cm), Arm (cm)
- Date (defaults to today; user may change)
- Save button — upserts `measurements` row on `measured_at` conflict, replacing all three measurement columns. On failure, show a toast error ("Save failed — check your connection") and keep the form data intact.

**History table:**
Columns: Date · Waist · Chest · Arm · Δ Waist · Δ Chest · Δ Arm (delta from first recorded measurement, shown as negative for loss)

---

## Progress Logic

| Metric | Formula / Rule |
|---|---|
| Day number | `differenceInDays(today, 2026-03-23) + 1`, clamped 1–33 |
| Target daily loss | `11.70 / 33` kg/day (use exact division, not rounded constant) |
| Expected weight today | `81.70 − ((11.70 / 33) × (dayNumber − 1))` |
| On track | actual cumulative loss within 0.5 kg of expected cumulative loss |
| Slightly behind | 0.5–1.5 kg behind expected cumulative loss |
| Behind | >1.5 kg behind expected cumulative loss |
| Projected April 25 weight | `currentWeight − (avgDailyLoss × daysRemaining)`; avgDailyLoss = (START_WEIGHT_KG − currentWeight) ÷ daysWithWeightLogged; daysRemaining = `differenceInDays(2026-04-25, today)` (calendar days from today to end date, inclusive). If avgDailyLoss ≤ 0 (weight unchanged or rising), show the projection as-is — it will equal or exceed the current weight, which is informative feedback. |
| Stall alert | Only evaluated when at least 3 weight entries exist. weight_kg (rounded to 2dp) identical across the 3 most recent log entries (order by log_date); calendar gaps are irrelevant. Suppressed entirely if fewer than 3 weight_kg values have been saved. |
| Meal compliance % | `sum(on_plan = true) ÷ count(all logged meals) × 100` across all days — meal-level aggregation, not average of per-day percentages; show "—" when denominator = 0 |
| Current streak | Most recent unbroken run of logged days (days with a `daily_logs` row AND at least one saved meal row) where every saved meal row for that day has `on_plan = true`. A logged day with zero saved meal rows is excluded from the streak calculation entirely (skipped — not counted, not breaking). Displayed identically in Dashboard and History summary bar. |
| Workout completion % | `(done + partial) ÷ nonRestDaysElapsed × 100` where nonRestDaysElapsed = count of Mon–Sat calendar days from Day 1 up to and including today, capped at 30 (the exact Mon–Sat count across the 33-day programme: 5 full weeks × 6 days = 30) |

---

## Out of Scope

- Multiple user accounts
- Push notifications
- Food calorie tracking
- Social sharing
- Offline / PWA mode
