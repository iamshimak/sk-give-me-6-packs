import type { Section } from '../types'
interface Props { section: Section; onNavigate: (s: Section) => void }
export default function Layout({ section }: Props) {
  return <div className="text-white p-8">Layout placeholder — section: {section}</div>
}
