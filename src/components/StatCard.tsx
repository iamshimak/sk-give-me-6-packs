interface Props {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
}

export default function StatCard({ label, value, unit, highlight }: Props) {
  const display = value === null ? '—' : `${value}${unit ? ' ' + unit : ''}`
  return (
    <div className="bg-navy-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {display}
      </p>
    </div>
  )
}
