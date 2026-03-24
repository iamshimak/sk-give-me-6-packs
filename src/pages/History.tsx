import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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

const MotionTbody = motion.tbody
const MotionTr = motion.tr

export default function History() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: logsData, error: logsErr }, { data: mealsData, error: mealsErr }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date', { ascending: false }),
        supabase.from('meals').select('*').order('log_date', { ascending: false }),
      ])
      if (logsErr || mealsErr) {
        setLoadError('Failed to load history — check your connection')
        setLoading(false)
        return
      }
      setLogs(logsData ?? [])
      setMeals(mealsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-gray-400">Loading…</div>
  if (loadError) return <div className="text-red-400 p-4">{loadError}</div>

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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          History
        </h1>

        {/* Summary bar — 6 mini glass tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
              <MotionTbody
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {logs.map((log) => {
                  const dayMeals = mealsByDate.get(log.log_date) ?? []
                  const onPlan = dayMeals.filter(m => m.on_plan).length
                  return (
                    <MotionTr
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
                    </MotionTr>
                  )
                })}
              </MotionTbody>
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
              <MotionTbody
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {meals.map((meal, i) => (
                  <MotionTr
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
                  </MotionTr>
                ))}
              </MotionTbody>
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
