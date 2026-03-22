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
  it('returns a number when losing weight', () => {
    const result = getProjectedEndWeight(80.0, 5, '2026-03-28')
    expect(typeof result).toBe('number')
  })

  it('returns current weight or above when not losing (zero loss)', () => {
    // avgDailyLoss = (81.70 - 81.70) / 1 = 0, so projection = currentWeight
    const result = getProjectedEndWeight(81.70, 1, '2026-03-23')
    expect(result).not.toBeNull()
    expect(result!).toBeGreaterThanOrEqual(81.70)
  })

  it('returns null when no weight entries logged yet', () => {
    expect(getProjectedEndWeight(81.70, 0, '2026-03-23')).toBeNull()
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

  it('ignores logs with null weight when counting the 3 most recent', () => {
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

  it('skips days with no meals (does not break streak)', () => {
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

  it('skips trailing off-plan days — streak reflects most recent on-plan run', () => {
    const logs = [
      BASE_LOG('2026-03-23'),
      BASE_LOG('2026-03-24'),
      BASE_LOG('2026-03-25'), // most recent, off-plan
    ]
    const meals: Meal[] = [
      { log_date: '2026-03-23', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
      { log_date: '2026-03-24', meal_type: 'breakfast', description: 'Fruit', on_plan: true },
      { log_date: '2026-03-25', meal_type: 'breakfast', description: 'Cake', on_plan: false },
    ]
    // Most recent day is off-plan, but streak shows the previous on-plan run
    expect(getCurrentStreak(logs, meals)).toBe(2)
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

  it('calculates positive rate when losing weight', () => {
    const logs = [
      BASE_LOG('2026-03-23', 81.70),
      BASE_LOG('2026-03-28', 80.70),
    ]
    const rate = getWeeklyLossRate(logs, '2026-03-28')
    expect(rate).not.toBeNull()
    expect(rate!).toBeGreaterThan(0)
  })
})
