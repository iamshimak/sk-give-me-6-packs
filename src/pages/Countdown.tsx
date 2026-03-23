import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { PROGRAMME_START } from '../lib/constants'

function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)', top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-4s' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-8s' }} />
    </div>
  )
}

export default function Countdown() {
  const today = new Date().toISOString().slice(0, 10)
  const days = differenceInCalendarDays(parseISO(PROGRAMME_START), parseISO(today))

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <MeshBackground />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 16px' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
          background: 'linear-gradient(135deg, #a855f7, #f5a623)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          6 Pack Tracker
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, marginBottom: 4 }}>
          Programme starts on
        </p>
        <p style={{ color: 'white', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
          {format(parseISO(PROGRAMME_START), 'MMMM d, yyyy')}
        </p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '32px 48px',
          }}
        >
          <p style={{
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            lineHeight: 1,
            background: 'linear-gradient(135deg, #a855f7, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            {days}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, marginTop: 8 }}>
            days to go
          </p>
        </motion.div>
      </div>
    </div>
  )
}
