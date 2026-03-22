import { describe, it, expect } from 'vitest'
import {
  getProgrammeState,
  getDayNumber,
  getWorkoutForDate,
  formatDate,
  isSunday,
  getNonRestDaysElapsed,
} from '../src/lib/dateUtils'

describe('getProgrammeState', () => {
  it('returns before for dates before programme start', () => {
    expect(getProgrammeState('2026-03-22')).toBe('before')
  })

  it('returns active on day 1', () => {
    expect(getProgrammeState('2026-03-23')).toBe('active')
  })

  it('returns active on day 33', () => {
    expect(getProgrammeState('2026-04-25')).toBe('active')
  })

  it('returns after for dates past programme end', () => {
    expect(getProgrammeState('2026-04-26')).toBe('after')
  })
})

describe('getDayNumber', () => {
  it('returns 1 on programme start', () => {
    expect(getDayNumber('2026-03-23')).toBe(1)
  })

  it('returns 33 on programme end', () => {
    expect(getDayNumber('2026-04-25')).toBe(33)
  })

  it('clamps to 33 after programme end', () => {
    expect(getDayNumber('2026-05-01')).toBe(33)
  })

  it('clamps to 1 before programme start', () => {
    expect(getDayNumber('2026-03-01')).toBe(1)
  })
})

describe('getWorkoutForDate', () => {
  it('returns strength for Monday (2026-03-23)', () => {
    expect(getWorkoutForDate('2026-03-23').type).toBe('strength')
  })

  it('returns cardio for Tuesday (2026-03-24)', () => {
    expect(getWorkoutForDate('2026-03-24').type).toBe('cardio')
  })

  it('returns rest for Sunday (2026-03-29)', () => {
    expect(getWorkoutForDate('2026-03-29').type).toBe('rest')
  })

  it('returns strength for Friday (2026-03-27)', () => {
    expect(getWorkoutForDate('2026-03-27').type).toBe('strength')
  })
})

describe('isSunday', () => {
  it('returns true for Sunday', () => {
    expect(isSunday('2026-03-29')).toBe(true)
  })

  it('returns false for Monday', () => {
    expect(isSunday('2026-03-23')).toBe(false)
  })
})

describe('getNonRestDaysElapsed', () => {
  it('returns 1 on day 1 (Monday)', () => {
    expect(getNonRestDaysElapsed('2026-03-23')).toBe(1)
  })

  it('returns 6 at end of first week (Saturday)', () => {
    expect(getNonRestDaysElapsed('2026-03-28')).toBe(6)
  })

  it('skips Sunday — same as Saturday count on Sunday', () => {
    expect(getNonRestDaysElapsed('2026-03-29')).toBe(6)
  })

  it('caps at 30 after programme end', () => {
    expect(getNonRestDaysElapsed('2026-04-30')).toBe(30)
  })
})
