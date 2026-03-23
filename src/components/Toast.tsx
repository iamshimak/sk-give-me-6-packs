import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  message: string
  type?: 'error' | 'success'
  onDismiss: () => void
}

export default function Toast({ message, type = 'error', onDismiss }: Props) {
  const onDismissRef = useRef(onDismiss)
  useEffect(() => { onDismissRef.current = onDismiss })
  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), 4000)
    return () => clearTimeout(t)
  }, []) // empty deps — timer starts once on mount

  const borderColor = type === 'error'
    ? 'rgba(239,68,68,0.50)'
    : 'rgba(74,222,128,0.50)'

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        position: 'fixed',
        bottom: 88, // above the 72px bottom nav on mobile
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        color: 'white',
        fontWeight: 500,
        zIndex: 50,
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </motion.div>
  )
}
