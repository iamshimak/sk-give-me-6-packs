import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onLogin: () => void
}

// Three mesh orbs — same spec as Layout but rendered locally
function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)', top: -100, right: -100, opacity: 0.5, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', bottom: -100, left: -50, opacity: 0.3, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-4s' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', top: '40%', left: '30%', opacity: 0.2, filter: 'blur(80px)', animation: 'drift 12s ease-in-out infinite', animationDelay: '-8s' }} />
    </div>
  )
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validUser = import.meta.env.VITE_APP_USER
    const validPass = import.meta.env.VITE_APP_PASS
    if (username === validUser && password === validPass) {
      localStorage.setItem('ft_auth', '1')
      onLogin()
    } else {
      setError('Incorrect username or password')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050f', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 400,
          padding: 32,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 28,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          margin: '0 16px',
        }}
      >
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #a855f7, #f5a623)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          6 Pack Tracker
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              autoComplete="current-password"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ color: '#f87171', fontSize: 13, margin: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #f5a623)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              padding: '12px 0',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: 4,
            }}
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
