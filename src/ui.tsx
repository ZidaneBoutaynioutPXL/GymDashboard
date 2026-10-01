import { Zap } from 'lucide-react'

export function StatCard({ icon: Icon, label, value, hint, color }: { icon: typeof Zap; label: string; value: string; hint: string; color: string }) {
  return <div className={`stat-card ${color}`}><div className="stat-card-top"><span>{label}</span><div className="stat-icon"><Icon size={18}/></div></div><strong>{value}</strong><p>{hint}</p><div className="stat-edge"/></div>
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading inner-page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}
