import { differenceInCalendarDays, parseISO, getDay } from 'date-fns'
import { PROGRAMME_START, PROGRAMME_END, WORKOUT_BY_DOW, NON_REST_DAYS_TOTAL } from './constants'
import type { ProgrammeState, Workout } from '../types'

function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function getProgrammeState(today: string): ProgrammeState {
  const d = parseDate(today)
  const start = parseDate(PROGRAMME_START)
  const end = parseDate(PROGRAMME_END)
  if (d < start) return 'before'
  if (d > end) return 'after'
  return 'active'
}

export function getDayNumber(today: string): number {
  const diff = differenceInCalendarDays(parseDate(today), parseDate(PROGRAMME_START)) + 1
  return Math.max(1, Math.min(33, diff))
}

export function getWorkoutForDate(dateStr: string): Workout {
  const dow = getDay(parseDate(dateStr)) // 0 = Sun, 6 = Sat
  return WORKOUT_BY_DOW[dow]
}

export function isSunday(dateStr: string): boolean {
  return getDay(parseDate(dateStr)) === 0
}

export function formatDate(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getNonRestDaysElapsed(today: string): number {
  const start = parseDate(PROGRAMME_START)
  const end = parseDate(PROGRAMME_END)
  const current = parseDate(today)
  const cap = current > end ? end : current

  let count = 0
  const cursor = new Date(start)
  while (cursor <= cap) {
    const dow = getDay(cursor)
    if (dow !== 0) count++ // not Sunday
    cursor.setDate(cursor.getDate() + 1)
  }
  return Math.min(count, NON_REST_DAYS_TOTAL)
}
