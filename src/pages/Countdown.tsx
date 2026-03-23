import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import { PROGRAMME_START } from '../lib/constants'
import MeshBackground from '../components/MeshBackground'

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
          {days <= 0 ? (
            <p style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              lineHeight: 1.3,
              background: 'linear-gradient(135deg, #a855f7, #f5a623)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              Programme is live! 🚀
            </p>
          ) : (
            <>
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
