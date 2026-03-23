import { useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

interface Props {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
  icon?: string
}

export default function StatCard({ label, value, unit, highlight, icon }: Props) {
  const motionVal = useMotionValue(0)
  const [displayNum, setDisplayNum] = useState('0')

  useEffect(() => {
    if (typeof value !== 'number') return
    // Set immediately so there's no flash of '0' if animation is skipped
    setDisplayNum(value % 1 !== 0 ? value.toFixed(2) : String(Math.round(value)))
    const controls = animate(motionVal, value, { duration: 1, ease: 'easeOut' })
    const unsub = motionVal.on('change', (v) => {
      setDisplayNum(value % 1 !== 0 ? v.toFixed(2) : String(Math.round(v)))
    })
    return () => {
      controls.stop()
      unsub()
    }
  }, [value]) // motionVal is a stable ref — safe to omit from deps

  const display =
    value === null
      ? '—'
      : typeof value === 'number'
        ? `${displayNum}${unit ? ' ' + unit : ''}`
        : `${value}${unit ? ' ' + unit : ''}`

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 16,
        cursor: 'default',
      }}
    >
      {icon && (
        <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      )}
      <p style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.40)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 4,
      }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          margin: 0,
          ...(highlight
            ? {
                background: 'linear-gradient(135deg, #a855f7, #f5a623)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            : { color: '#fff' }),
        }}
      >
        {display}
      </p>
    </motion.div>
  )
}
