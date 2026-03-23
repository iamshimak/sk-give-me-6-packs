import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'
import {
  START_WEIGHT_KG, GOAL_WEIGHT_KG, TOTAL_DAYS,
} from '../lib/constants'
import {
  getDayNumber, getWorkoutForDate, isSunday, getProgrammeState,
} from '../lib/dateUtils'
import {
  getPaceBanner, getProjectedEndWeight,
  isStallAlert, getMealCompliance, getCurrentStreak,
  getWorkoutCompletionPct, getWeeklyLossRate,
} from '../lib/computations'
import StatCard from '../components/StatCard'
import type { DailyLog, Meal } from '../types'

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const programmeState = getProgrammeState(today)
  const dayNumber = getDayNumber(today)
  const workout = getWorkoutForDate(today)

  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: logsData }, { data: mealsData }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date'),
        supabase.from('meals').select('*'),
      ])
      const allLogs: DailyLog[] = logsData ?? []
      setLogs(allLogs)
      setMeals(mealsData ?? [])
      setTodayLog(allLogs.find((l) => l.log_date === today) ?? null)
      setLoading(false)
    }
    load()
  }, [today])

  if (loading) return <div className="text-gray-400">Loading…</div>

  const weightLogs = logs.filter((l) => l.weight_kg !== null)
  const latestWeight = weightLogs.at(-1)?.weight_kg ?? null
  const totalLost = latestWeight !== null ? START_WEIGHT_KG - latestWeight : null
  const mealCompliance = getMealCompliance(meals)
  const workoutPct = getWorkoutCompletionPct(logs, today)
  const streak = getCurrentStreak(logs, meals)
  const weeklyRate = getWeeklyLossRate(logs, today)

  const showPace = latestWeight !== null && programmeState === 'active'
  const pace = showPace ? getPaceBanner(latestWeight!, dayNumber) : null
  const projected = latestWeight !== null
    ? getProjectedEndWeight(latestWeight, weightLogs.length, today)
    : null

  const stall = isStallAlert(logs)

  // Chart data: target line + actual weight points
  const chartData = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1
    const target = parseFloat((START_WEIGHT_KG - ((11.70 / 33) * i)).toFixed(2))
    const logForDay = logs.find((l) => getDayNumber(l.log_date) === day)
    return {
      day,
      target,
      actual: logForDay?.weight_kg ?? null,
    }
  })

  // Workout card visibility rules (checked in order):
  // 1. If today is Sunday AND no daily_logs row exists for today → hide
  // 2. If a daily_logs row exists and workout_status = 'rest' → hide
  // 3. Otherwise → show
  const showWorkoutCard = !(
    (isSunday(today) && !todayLog) ||
    todayLog?.workout_status === 'rest'
  )

  const paceColor = {
    'on-track': 'bg-green-900/50 border-green-500 text-green-300',
    'slightly-behind': 'bg-yellow-900/50 border-yellow-500 text-yellow-300',
    'behind': 'bg-red-900/50 border-red-500 text-red-300',
  }

  const paceLabel = {
    'on-track': '✅ On Track',
    'slightly-behind': '⚠️ Slightly Behind',
    'behind': '🔴 Behind Pace',
  }

  return (
    <div className="space-y-6">
      {/* Header: Day badge + progress bar */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <span className="bg-amber-400 text-navy-900 text-sm font-bold px-3 py-1 rounded-full">
            Day {dayNumber} of 33
          </span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-2">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${(dayNumber / 33) * 100}%` }}
          />
        </div>
      </div>

      {/* Stats grid — 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Current Weight" value={latestWeight !== null ? latestWeight.toFixed(2) : null} unit="kg" highlight />
        <StatCard label="Total Lost" value={totalLost !== null ? totalLost.toFixed(2) : null} unit="kg" />
        <StatCard label="Meal Compliance" value={mealCompliance !== null ? mealCompliance : null} unit="%" />
        <StatCard label="Workout Completion" value={workoutPct !== null ? workoutPct : null} unit="%" />
        <StatCard label="Current Streak" value={streak} unit="days" />
        <StatCard label="Weekly Loss Rate" value={weeklyRate !== null ? weeklyRate.toFixed(2) : null} unit="kg/wk" />
      </div>

      {/* Pace banner — only when active programme + weight logged */}
      {showPace && pace && (
        <div className={`rounded-xl border px-4 py-3 ${paceColor[pace]}`}>
          <p className="font-semibold">{paceLabel[pace]}</p>
          {projected !== null && (
            <p className="text-sm mt-1">
              Projected weight on April 25: <strong>{projected.toFixed(2)} kg</strong>
              {' '}(goal: {GOAL_WEIGHT_KG} kg)
            </p>
          )}
        </div>
      )}

      {/* Stall alert */}
      {stall && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3">
          <p className="text-amber-400 font-semibold mb-2">⚠️ Weight Stall Detected</p>
          <p className="text-sm text-gray-300">Your weight hasn't changed in 3+ entries. Try:</p>
          <ul className="text-sm text-gray-300 list-disc ml-4 mt-1 space-y-1">
            <li>Reduce fruit intake — natural sugars may be stalling fat loss</li>
            <li>Add an extra 20-min walk tomorrow</li>
            <li>Check sleep — aim for 7–8 hours</li>
          </ul>
        </div>
      )}

      {/* Weight trend chart */}
      <div className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Weight Trend
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis
              domain={[68, 83]}
              stroke="#4b5563"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{ background: '#16213e', border: 'none', borderRadius: 8 }}
              labelFormatter={(l) => `Day ${l}`}
            />
            <ReferenceLine y={GOAL_WEIGHT_KG} stroke="#f5a623" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#f5a623', fontSize: 11 }} />
            <Line type="monotone" dataKey="target" stroke="#f5a623" strokeDasharray="3 3" dot={false} strokeOpacity={0.4} />
            <Line type="monotone" dataKey="actual" stroke="#f5a623" dot={{ fill: '#f5a623', r: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Today's workout card */}
      {showWorkoutCard && (
        <div className="bg-navy-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Today's Workout — {workout.name}
          </h2>
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-white text-sm">{ex.name}</span>
                <span className="text-amber-400 text-sm font-mono">{ex.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
