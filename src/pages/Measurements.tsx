import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .order('measured_at')
    if (error) {
      setToast({ message: 'Failed to load measurements', type: 'error' })
      return
    }
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

  const canSave = parseFloat(waist) > 0 && parseFloat(chest) > 0 && parseFloat(arm) > 0

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
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.40))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Measurements
        </h1>

        {/* Entry form */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 24 }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Log Measurements</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input"
              style={{ width: 'auto' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Waist (cm)', value: waist, set: setWaist },
              { label: 'Chest (cm)', value: chest, set: setChest },
              { label: 'Arm (cm)', value: arm, set: setArm },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6 }}>{label}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="glass-input"
                />
              </div>
            ))}
          </div>
          <motion.button
            onClick={handleSave}
            disabled={!canSave || saving}
            whileHover={{ scale: canSave ? 1.01 : 1 }}
            whileTap={{ scale: canSave ? 0.98 : 1 }}
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
              cursor: !canSave || saving ? 'not-allowed' : 'pointer',
              opacity: !canSave || saving ? 0.4 : 1,
              fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save Measurements'}
          </motion.button>
        </div>

        {/* History table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '2px', padding: '16px 20px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Measurement History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Waist', 'Chest', 'Arm', 'Δ Waist', 'Δ Chest', 'Δ Arm'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((m) => (
                  <tr
                    key={m.measured_at}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#fff' }}>{formatDate(m.measured_at)}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.waist_cm}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.chest_cm}</td>
                    <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: '#fff' }}>{m.arm_cm}</td>
                    {first && m.measured_at !== first.measured_at ? (
                      <>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.waist_cm <= first.waist_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.waist_cm, first.waist_cm)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.chest_cm <= first.chest_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.chest_cm, first.chest_cm)}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: "'Space Mono', monospace", color: m.arm_cm >= first.arm_cm ? 'rgba(74,222,128,1)' : 'rgba(239,68,68,1)' }}>
                          {deltaVal(m.arm_cm, first.arm_cm)}
                        </td>
                      </>
                    ) : (
                      <><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td><td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.25)' }}>—</td></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <p style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)' }}>No measurements yet</p>
            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
