import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'error' | 'success'
  onDismiss: () => void
}

export default function Toast({ message, type = 'error', onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-medium z-50 ${
        type === 'error' ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      {message}
    </div>
  )
}
