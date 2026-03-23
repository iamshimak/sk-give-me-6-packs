import { useState, lazy, Suspense } from 'react'
import type { Section } from '../types'
import Sidebar from './Sidebar'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const CheckIn = lazy(() => import('../pages/CheckIn'))
const History = lazy(() => import('../pages/History'))
const Measurements = lazy(() => import('../pages/Measurements'))

interface Props {
  section: Section
  onNavigate: (s: Section) => void
}

export default function Layout({ section, onNavigate }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const page = {
    dashboard: <Dashboard />,
    checkin: <CheckIn />,
    history: <History />,
    measurements: <Measurements />,
  }[section]

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar
        section={section}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-navy-800 border-b border-navy-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 text-xl"
          >
            ☰
          </button>
          <span className="text-amber-400 font-semibold">6 Pack Tracker</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
            {page}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
