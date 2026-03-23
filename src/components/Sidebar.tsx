import type { Section } from '../types'

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'checkin', label: 'Daily Check-in', icon: '✏️' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'measurements', label: 'Measurements', icon: '📏' },
]

interface Props {
  section: Section
  onNavigate: (s: Section) => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ section, onNavigate, isOpen, onClose }: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-navy-800 z-30 flex flex-col py-6 px-3 transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <h1 className="text-amber-400 font-bold text-lg px-3 mb-8">6 Pack Tracker</h1>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left
                ${section === item.id
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-navy-700'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
