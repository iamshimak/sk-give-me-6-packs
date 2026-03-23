import { motion } from 'framer-motion'

interface Props {
  value: number | null
  onChange: (v: number) => void
  label: string
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div>
      <p style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.40)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 6,
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            whileTap={{ scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{
              fontSize: 24,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              color: value !== null && n <= value ? '#f5a623' : 'rgba(255,255,255,0.20)',
              lineHeight: 1,
            }}
          >
            ★
          </motion.button>
        ))}
      </div>
    </div>
  )
}
