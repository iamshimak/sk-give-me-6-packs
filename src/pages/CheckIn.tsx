import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const form = emptyForm(isSunday(log.log_date))
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
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const restDay = isSunday(today)

  const [form, setForm] = useState<CheckInFormState>(emptyForm(restDay))
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load existing data for today
  useEffect(() => {
    async function load() {
      const [{ data: logData, error: logErr }, { data: mealsData, error: mealsErr }] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('log_date', today).maybeSingle(),
        supabase.from('meals').select('*').eq('log_date', today),
      ])
      if (logErr || mealsErr) {
        setLoadError('Failed to load today\'s data — check your connection')
        return
      }
      if (logData) {
        setForm(logToForm(logData as DailyLog, (mealsData ?? []) as Meal[]))
      }
    }
    load()
  }, [today])

  const weightDelta = form.weight_kg
    ? parseFloat(form.weight_kg) - START_WEIGHT_KG
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
