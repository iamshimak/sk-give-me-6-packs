# Fitness Tracker — Design Spec
**Date:** 2026-03-22
**Programme:** 33-day fat loss, March 23 → April 25, 2025
**Starting weight:** 81.70 kg | **Goal weight:** 70.00 kg | **Target loss:** 11.70 kg

---

## Overview

A personal web-based fitness tracker for a 33-day fat loss programme. Cross-device (mobile + desktop), password-gated with hardcoded credentials, no user registration flow. Data persists in Supabase; frontend deployed on Vercel.

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
- Simple client-side check on login screen
- Successful login writes a flag to `localStorage`; the app reads it on load to skip the login gate
- Both mobile and desktop visit the same Vercel URL and log in once per device

---

## Database Schema (Supabase)

### `daily_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| log_date | date UNIQUE | one row per day |
| weight_kg | numeric | |
| water_ml | integer | |
| sleep_hours | numeric | |
| energy | smallint | 1–5 |
| hunger | smallint | 1–5 |
| workout_status | text | done / partial / missed / rest |
| workout_notes | text | nullable |
| soreness_notes | text | nullable |
| created_at | timestamptz | |

### `meals`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| log_date | date | FK → daily_logs.log_date |
| meal_type | text | breakfast / lunch / snack / dinner |
| description | text | |
| on_plan | boolean | |

### `measurements`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto |
| measured_at | date UNIQUE | |
| waist_cm | numeric | |
| chest_cm | numeric | |
| arm_cm | numeric | |

No `session_id` needed — single-user app.

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
- Current Weight (kg)
- Total Weight Lost (kg)
- Meal Compliance % (on-plan meals / total logged meals)
- Workout Completion % (done or partial / non-rest days elapsed)
- Consecutive Clean Days Streak (days with all 4 meals on-plan)
- Weekly Loss Rate (kg/week, rolling 7-day average)

**Pace banner:**
- Green — On Track (actual cumulative loss within 0.5 kg of target)
- Yellow — Slightly Behind (0.5–1.5 kg behind target)
- Red — Behind Pace (>1.5 kg behind target)
- Always shows: projected weight on April 25 at current rate
- Target rate: 11.70 kg ÷ 33 days = 0.355 kg/day

**Stall alert:** Amber warning card shown when weight is unchanged for 3+ consecutive logged days. Suggested corrective actions:
1. Reduce fruit intake (natural sugars may be stalling fat loss)
2. Add an extra 20-min walk tomorrow
3. Check sleep — aim for 7–8 hours

**Weight trend chart (Recharts LineChart):**
- X-axis: Day 1–33
- Actual weight line (amber)
- Dashed target reference line from 81.70 kg to 70.00 kg

**Today's workout card:** Shows workout name, and for each exercise: name, sets × reps (or duration). Hidden on Rest days.

---

## Workout Schedule

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
No workout card shown. Check-in workout field auto-set to Rest.

---

## Section 2 — Daily Check-in

**Weight log:**
- Number input (kg, 2 decimal places)
- Delta display below: "−X.XX kg from start"

**Meal log (4 cards):** Breakfast, Lunch, Snack, Dinner
- Text area for description
- Toggle button: On Plan (green) / Off Plan (red)

**Workout log:**
- 4-button group: Done / Partial / Missed / Rest
- Text area for notes

**Wellness log:**
- Water intake (ml) — number input
- Sleep (hours) — number input
- Energy — 1–5 star rating
- Hunger — 1–5 star rating
- Soreness / extra notes — text area

**Save button:** Upserts `daily_logs` row and all 4 `meals` rows for today's date.

---

## Section 3 — History

**Summary bar:**
- Total days logged
- Overall meal compliance %
- Workouts completed
- Average daily water (ml)
- Average sleep (hours)
- Current streak

**Table 1 — Daily log:**
Columns: Date · Day# · Weight · Meal Score (e.g. 3/4) · Workout · Water · Sleep · Energy

**Table 2 — Meal detail:**
Columns: Date · Meal · Description · Status
Off-plan rows highlighted in red.

Both tables sorted newest → oldest.

---

## Section 4 — Measurements

**Entry form:**
- Waist (cm), Chest (cm), Arm (cm)
- Date (defaults to today)
- Save button — upserts `measurements` row

**History table:**
Columns: Date · Waist · Chest · Arm · Δ Waist · Δ Chest · Δ Arm (delta from first recorded measurement)

---

## Progress Logic

| Metric | Formula |
|---|---|
| Target daily loss | 11.70 ÷ 33 = 0.355 kg/day |
| Expected weight today | 81.70 − (0.355 × (dayNumber − 1)) |
| On track | actual loss within 0.5 kg of expected |
| Slightly behind | 0.5–1.5 kg behind expected |
| Behind | >1.5 kg behind expected |
| Projected April 25 weight | currentWeight − (avgDailyLoss × daysRemaining) |
| Stall alert | weight unchanged for 3+ consecutive logged days |
| Meal compliance % | onPlanMeals ÷ totalLoggedMeals × 100 |
| Streak | consecutive days where all 4 meals are on-plan |

---

## Out of Scope

- Multiple user accounts
- Push notifications
- Food calorie tracking
- Social sharing
- Offline / PWA mode
