import { motion } from 'framer-motion'
import type { Section } from '../types'

const TABS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'checkin', icon: '✏️', label: 'Check-in' },
  { id: 'history', icon: '📅', label: 'History' },
  { id: 'measurements', icon: '📏', label: 'Measure' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function BottomNav({ section, onNavigate }: Props) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        background: 'rgba(10,8,20,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 40,
      }}
    >
      {TABS.map((tab) => {
        const active = section === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: '100%',
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <motion.span
              style={{ fontSize: 20, display: 'block', lineHeight: 1 }}
              animate={{ y: active ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {tab.icon}
            </motion.span>
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: active ? '#a855f7' : 'rgba(255,255,255,0.30)',
              }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #a855f7, #f5a623)',
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
