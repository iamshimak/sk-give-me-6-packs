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
          { label: 'Avg Water', value: logs.filter(l => l.water_ml).length ? `${Math.round(avgWater)} ml` : '—' },
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
