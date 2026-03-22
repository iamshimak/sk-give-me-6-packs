import { useState } from 'react'
import { getProgrammeState } from './lib/dateUtils'
import Login from './pages/Login'
import Countdown from './pages/Countdown'
import Layout from './components/Layout'

type Section = 'dashboard' | 'checkin' | 'history' | 'measurements'

export default function App() {
  const [isAuthed, setIsAuthed] = useState(
    () => localStorage.getItem('ft_auth') === '1',
  )
  const [section, setSection] = useState<Section>('dashboard')

  if (!isAuthed) {
    return <Login onLogin={() => setIsAuthed(true)} />
  }

  const today = new Date().toISOString().slice(0, 10)
  const state = getProgrammeState(today)

  if (state === 'before') {
    return <Countdown />
  }

  return (
    <Layout section={section} onNavigate={setSection} />
  )
}
