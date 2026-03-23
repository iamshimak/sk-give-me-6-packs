import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Section } from '../types'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const CheckIn = lazy(() => import('../pages/CheckIn'))
const History = lazy(() => import('../pages/History'))
const Measurements = lazy(() => import('../pages/Measurements'))

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

function ActivePage({ section }: { section: Section }) {
  if (section === 'dashboard') return <Dashboard />
  if (section === 'checkin') return <CheckIn />
  if (section === 'history') return <History />
  return <Measurements />
}

export default function Layout({ section, onNavigate }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#05050f', overflow: 'hidden', position: 'relative' }}>

      {/* Animated mesh orbs — fixed, behind everything */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)',
          top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)',
          bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
          animationDelay: '-4s',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)',
          top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)',
          animation: 'drift 12s ease-in-out infinite',
          animationDelay: '-8s',
        }} />
      </div>

      {/* Noise texture overlay */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.04 }}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noiseOut" />
          <feColorMatrix type="saturate" values="0" in="noiseOut" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex" style={{ position: 'relative', zIndex: 10 }}>
        <Sidebar section={section} onNavigate={onNavigate} />
      </div>

      {/* Main scrollable content */}
      <main
        className="pb-[72px] lg:pb-0"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', position: 'relative', zIndex: 2 }}
      >
        <Suspense fallback={null}>
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <ActivePage section={section} />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav section={section} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
