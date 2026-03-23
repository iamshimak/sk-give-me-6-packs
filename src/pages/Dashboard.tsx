import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
  START_WEIGHT_KG, GOAL_WEIGHT_KG, TOTAL_DAYS, PROGRAMME_END,
} from '../lib/constants'
import {
  getDayNumber, getWorkoutForDate, isSunday, getProgrammeState,
} from '../lib/dateUtils'
import {
  getPaceBanner, getProjectedEndWeight,
  isStallAlert, getMealCompliance, getCurrentStreak,
  getWorkoutCompletionPct, getWeeklyLossRate, getExpectedWeight,
} from '../lib/computations'
import StatCard from '../components/StatCard'
import Toast from '../components/Toast'
import type { DailyLog, Meal } from '../types'

// Pace badge styles (inline pill inside hero card)
const PACE_BADGE: Record<string, React.CSSProperties> = {
  'on-track': { background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.30)', color: '#4ade80' },
  'slightly-behind': { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)', color: '#fbbf24' },
  'behind': { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444' },
}

// Pace banner styles (full-width card below hero)
const PACE_BANNER: Record<string, React.CSSProperties> = {
  'on-track': { background: 'rgba(74,222,128,0.06)', boxShadow: '0 0 0 1px rgba(74,222,128,0.4), 0 0 16px rgba(74,222,128,0.15)' },
  'slightly-behind': { background: 'rgba(251,191,36,0.06)', boxShadow: '0 0 0 1px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.15)' },
  'behind': { background: 'rgba(239,68,68,0.06)', boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 0 16px rgba(239,68,68,0.15)' },
}

const PACE_DOT: Record<string, string> = {
  'on-track': '#4ade80',
  'slightly-behind': '#fbbf24',
  'behind': '#ef4444',
}

const PACE_TEXT: Record<string, string> = {
  'on-track': 'On Track',
  'slightly-behind': 'Slightly Behind',
  'behind': 'Behind',
}

// Stagger variants for stats grid
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
}

export default function Dashboard() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const programmeState = getProgrammeState(today)
  const dayNumber = getDayNumber(today)
  const workout = getWorkoutForDate(today)

  const [logs, setLogs] = useState<DailyLog[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // toast: reserved for future error notifications (e.g. retry after load failure)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: logsData, error: logsErr }, { data: mealsData, error: mealsErr }] = await Promise.all([
        supabase.from('daily_logs').select('*').order('log_date'),
        supabase.from('meals').select('*'),
      ])
      if (logsErr || mealsErr) {
        setLoadError('Failed to load data — check your connection')
        setLoading(false)
        return
      }
      const allLogs: DailyLog[] = logsData ?? []
      setLogs(allLogs)
      setMeals(mealsData ?? [])
      setTodayLog(allLogs.find((l) => l.log_date === today) ?? null)
      setLoading(false)
    }
    load()
  }, [today])

  // SVG ring progress — set up before early returns (hook rules)
  const progress = Math.min(dayNumber / 33, 1)
  const ringOffset = useMotionValue(314)
  useEffect(() => {
    const controls = animate(ringOffset, (1 - progress) * 314, {
      type: 'spring',
      stiffness: 60,
      damping: 18,
    })
    return () => controls.stop()
  }, [progress]) // ringOffset is a stable MotionValue ref, safe to omit

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'rgba(255,255,255,0.40)' }}>
      Loading…
    </div>
  )
  if (loadError) return (
    <div style={{ color: '#f87171', padding: 16 }}>{loadError}</div>
  )

  const weightLogs = logs.filter((l) => l.weight_kg !== null)
  const latestWeight = weightLogs.at(-1)?.weight_kg ?? null
  const totalLost = latestWeight !== null ? START_WEIGHT_KG - latestWeight : null
  const mealCompliance = getMealCompliance(meals)
  const workoutPct = getWorkoutCompletionPct(logs, today)
  const streak = getCurrentStreak(logs, meals)
  const weeklyRate = getWeeklyLossRate(logs, today)

  const pace = (latestWeight !== null && programmeState === 'active')
    ? getPaceBanner(latestWeight, dayNumber)
    : null
  const showPace = pace !== null
  const projected = latestWeight !== null
    ? getProjectedEndWeight(latestWeight, weightLogs.length, today)
    : null

  const stall = isStallAlert(logs)

  const chartData = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1
    const target = parseFloat(getExpectedWeight(day).toFixed(2))
    const logForDay = logs.find((l) => getDayNumber(l.log_date) === day)
    return { day, target, actual: logForDay?.weight_kg ?? null }
  })

  const showWorkoutCard = !(
    (isSunday(today) && !todayLog) ||
    todayLog?.workout_status === 'rest'
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.40)', marginBottom: 4 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Good morning
          </h1>
        </div>

        {/* Hero card — day + ring */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Left: day number + pace badge + projected */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                style={{
                  fontSize: 80,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  lineHeight: 1,
                  display: 'block',
                  background: 'linear-gradient(135deg, #a855f7, #f5a623)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {dayNumber}
              </motion.span>
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.25)' }}>/ 33</span>
            </div>

            {/* Pace badge */}
            {pace && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                marginTop: 8,
                ...PACE_BADGE[pace],
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: PACE_DOT[pace],
                  display: 'inline-block',
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
                {PACE_TEXT[pace]}
              </div>
            )}

            {projected !== null && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                Projected: {projected.toFixed(2)} kg by {format(parseISO(PROGRAMME_END), 'MMMM d')}
              </p>
            )}
          </div>

          {/* Right: SVG ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" width="120" height="120">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f5a623" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="314"
                style={{ strokeDashoffset: ringOffset, transform: 'rotate(-90deg)', transformOrigin: 'center' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700, fontSize: 18, color: '#fff',
            }}>
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        {/* Stats grid — staggered entrance */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {[
            { label: 'Current Weight', value: latestWeight, unit: 'kg', highlight: true, icon: '⚖️' },
            { label: 'Total Lost', value: totalLost, unit: 'kg', icon: '📉' },
            { label: 'Meal Compliance', value: mealCompliance, unit: '%', icon: '🍽️' },
            { label: 'Workout Completion', value: workoutPct, unit: '%', icon: '💪' },
            { label: 'Current Streak', value: streak, unit: 'days', icon: '🔥' },
            { label: 'Weekly Loss Rate', value: weeklyRate, unit: 'kg/wk', icon: '📊' },
          ].map((props) => (
            <motion.div key={props.label} variants={cardVariants}>
              <StatCard {...props} />
            </motion.div>
          ))}
        </motion.div>

        {/* Pace banner */}
        {showPace && pace && (
          <div style={{
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            ...PACE_BANNER[pace],
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: PACE_DOT[pace],
              flexShrink: 0,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <div>
              <p style={{ fontWeight: 600, margin: 0, color: PACE_DOT[pace] }}>{PACE_TEXT[pace]}</p>
              {projected !== null && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: '2px 0 0' }}>
                  Projected weight on {format(parseISO(PROGRAMME_END), 'MMMM d')}: <strong>{projected.toFixed(2)} kg</strong>{' '}
                  (goal: {GOAL_WEIGHT_KG} kg)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stall alert */}
        {stall && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.04))',
            border: '1px solid rgba(245,166,35,0.20)',
            borderRadius: 20,
            padding: '16px 20px',
          }}>
            <p style={{ color: '#f5a623', fontWeight: 600, marginBottom: 8 }}>⚠️ Weight Stall Detected</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 8 }}>Your weight hasn't changed in 3+ entries. Try:</p>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              style={{ paddingLeft: 16, margin: 0 }}
            >
              {[
                'Reduce fruit intake — natural sugars may be stalling fat loss',
                'Add an extra 20-min walk tomorrow',
                'Check sleep — aim for 7–8 hours',
              ].map((tip) => (
                <motion.li
                  key={tip}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200 } } }}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginBottom: 4 }}
                >
                  {tip}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )}

        {/* Weight trend chart */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '20px 16px',
        }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
            Weight Trend
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.12)" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
              <YAxis
                domain={[Math.floor(GOAL_WEIGHT_KG) - 2, Math.ceil(START_WEIGHT_KG) + 2]}
                stroke="rgba(255,255,255,0.12)"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,8,20,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  backdropFilter: 'blur(20px)',
                }}
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
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,166,35,0.06))',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '20px 24px',
          }}>
            <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>
              Today's Workout — {workout.name}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workout.exercises.map((ex) => (
                <div key={ex.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#fff' }}>{ex.name}</span>
                  <span style={{ fontSize: 14, fontFamily: "'Space Mono', monospace", color: '#f5a623' }}>{ex.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
