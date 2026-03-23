import { motion } from 'framer-motion'
import type { Section } from '../types'

const NAV_ITEMS: { id: Section; icon: string }[] = [
  { id: 'dashboard', icon: '📊' },
  { id: 'checkin', icon: '✏️' },
  { id: 'history', icon: '📅' },
  { id: 'measurements', icon: '📏' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function Sidebar({ section, onNavigate }: Props) {
  return (
    <aside
      style={{
        width: 72,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          marginBottom: 16,
        }}
      >
        💪
      </div>

      {NAV_ITEMS.map((item) => {
        const active = section === item.id
        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              border: 'none',
              background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
              position: 'relative',
              color: 'inherit',
            }}
          >
            {item.icon}
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  height: '50%',
                  width: 3,
                  background: 'linear-gradient(180deg, #a855f7, #f5a623)',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            )}
          </motion.button>
        )
      })}
    </aside>
  )
}
