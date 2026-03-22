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
