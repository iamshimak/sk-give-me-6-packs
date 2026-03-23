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

  // Load existing data for today
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
      // Step 1: Upsert daily_logs (must complete before meals due to FK constraint)
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
        {saving ? 'Saving…' : "Save Today's Check-in"}
      </button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
