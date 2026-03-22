import { useState, FormEvent } from 'react'

interface Props {
  onLogin: () => void
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
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="w-full max-w-sm bg-navy-800 rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
          6 Pack Tracker
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-amber-400 text-navy-900 font-bold py-2 rounded-lg hover:bg-amber-300 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
