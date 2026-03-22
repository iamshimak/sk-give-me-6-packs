import { differenceInCalendarDays, parseISO } from 'date-fns'
import { PROGRAMME_START } from '../lib/constants'

export default function Countdown() {
  const today = new Date().toISOString().slice(0, 10)
  const days = differenceInCalendarDays(parseISO(PROGRAMME_START), parseISO(today))

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-400 mb-4">6 Pack Tracker</h1>
        <p className="text-gray-400 text-lg mb-2">Programme starts on</p>
        <p className="text-white text-2xl font-semibold mb-6">March 23, 2026</p>
        <div className="bg-navy-800 rounded-xl px-8 py-6 inline-block">
          <p className="text-5xl font-bold text-amber-400">{days}</p>
          <p className="text-gray-400 mt-1">days to go</p>
        </div>
      </div>
    </div>
  )
}
