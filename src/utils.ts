import type { NoteCategory } from './data'

export const categories: NoteCategory[] = ['Training', 'Strength', 'Nutrition', 'Mindset']
export const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` }
export const uid = () => crypto.randomUUID()
export const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
