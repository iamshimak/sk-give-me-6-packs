interface Props {
  value: number | null
  onChange: (v: number) => void
  label: string
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-2xl transition ${
              value !== null && n <= value ? 'text-amber-400' : 'text-gray-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
