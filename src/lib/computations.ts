import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import { START_WEIGHT_KG, PROGRAMME_END } from './constants'
import { getNonRestDaysElapsed } from './dateUtils'
import type { DailyLog, Meal } from '../types'

export type PaceBanner = 'on-track' | 'slightly-behind' | 'behind'

export function getExpectedWeight(dayNumber: number): number {
  // Uses 32 equal loss intervals over days 1–33, so expected weight on Day 33
  // is ~70.36 kg (not exactly 70.00) — this is intentional per spec.
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
): number | null {
  if (daysWithWeightLogged === 0) return null
  const avgDailyLoss = (START_WEIGHT_KG - currentWeight) / daysWithWeightLogged
  const daysRemaining = differenceInCalendarDays(
    parseISO(PROGRAMME_END),
    parseISO(today),
  )
  return currentWeight - avgDailyLoss * daysRemaining
}

export function isStallAlert(logs: DailyLog[]): boolean {
  const weights = [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
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
  let counting = false
  // Walk from newest backward
  for (let i = sorted.length - 1; i >= 0; i--) {
    const date = sorted[i].log_date
    const dayMeals = mealsByDate.get(date) ?? []

    // Skip days with no meals (does not break streak)
    if (dayMeals.length === 0) continue

    const allOnPlan = dayMeals.every((m) => m.on_plan)
    if (allOnPlan) {
      counting = true
      streak++
    } else {
      // Off-plan day: if we've already started counting, stop here
      if (counting) break
      // Otherwise skip trailing off-plan days at the end
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
  const windowStart = subDays(parseISO(today), 6) // today - 6 days = 7-day window
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
