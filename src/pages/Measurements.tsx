import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/dateUtils'
import Toast from '../components/Toast'
import type { Measurement } from '../types'

export default function Measurements() {
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [date, setDate] = useState(today)
  const [waist, setWaist] = useState('')
  const [chest, setChest] = useState('')
  const [arm, setArm] = useState('')
  const [history, setHistory] = useState<Measurement[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .order('measured_at')
    setHistory((data ?? []) as Measurement[])
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // Pre-populate form when date changes (or when history loads)
  useEffect(() => {
    const existing = history.find((m) => m.measured_at === date)
    if (existing) {
      setWaist(existing.waist_cm.toString())
      setChest(existing.chest_cm.toString())
      setArm(existing.arm_cm.toString())
    } else {
      setWaist('')
      setChest('')
      setArm('')
    }
  }, [date, history])

  const canSave = waist !== '' && chest !== '' && arm !== ''

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const { error } = await supabase.from('measurements').upsert(
        {
          measured_at: date,
          waist_cm: parseFloat(waist),
          chest_cm: parseFloat(chest),
          arm_cm: parseFloat(arm),
        },
        { onConflict: 'measured_at' },
      )
      if (error) throw error
      setToast({ message: 'Measurements saved!', type: 'success' })
      await loadHistory()
    } catch {
      setToast({ message: 'Save failed — check your connection', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [canSave, date, waist, chest, arm, loadHistory])

  const first = history[0]
  const deltaVal = (current: number, baseline: number) => {
    const d = current - baseline
    return `${d <= 0 ? '' : '+'}${d.toFixed(1)}`
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Measurements</h1>

      {/* Entry form */}
      <div className="bg-navy-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Log Measurements</h2>
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Waist (cm)', value: waist, set: setWaist },
            { label: 'Chest (cm)', value: chest, set: setChest },
            { label: 'Arm (cm)', value: arm, set: setArm },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full bg-amber-400 text-navy-900 font-bold py-2.5 rounded-xl hover:bg-amber-300 disabled:opacity-40 transition"
        >
          {saving ? 'Saving…' : 'Save Measurements'}
        </button>
      </div>

      {/* History table */}
      <div className="bg-navy-800 rounded-xl overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-navy-700">
          Measurement History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase border-b border-navy-700">
                {['Date', 'Waist', 'Chest', 'Arm', 'Δ Waist', 'Δ Chest', 'Δ Arm'].map(h => (
                  <th key={h} className="px-4 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((m) => (
                <tr key={m.measured_at} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(m.measured_at)}</td>
                  <td className="px-4 py-2">{m.waist_cm}</td>
                  <td className="px-4 py-2">{m.chest_cm}</td>
                  <td className="px-4 py-2">{m.arm_cm}</td>
                  {first ? (
                    <>
                      <td className={`px-4 py-2 font-mono ${m.waist_cm <= first.waist_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.waist_cm, first.waist_cm)}
                      </td>
                      <td className={`px-4 py-2 font-mono ${m.chest_cm <= first.chest_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.chest_cm, first.chest_cm)}
                      </td>
                      <td className={`px-4 py-2 font-mono ${m.arm_cm <= first.arm_cm ? 'text-green-400' : 'text-red-400'}`}>
                        {deltaVal(m.arm_cm, first.arm_cm)}
                      </td>
                    </>
                  ) : (
                    <><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td><td className="px-4 py-2">—</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <p className="text-gray-500 text-center py-8">No measurements yet</p>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
