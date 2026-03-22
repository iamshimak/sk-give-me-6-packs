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
  id?: string
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
  id?: string
  log_date: string
  meal_type: MealType
  description: string
  on_plan: boolean
}

export interface Measurement {
  id?: string
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
