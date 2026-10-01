import { LIFT_IDS, type LiftEntry, type LiftId, type Profile } from './data'
import { streetThresholds } from './street'

export const liftInfo: Record<LiftId, { name: string; short: string; icon: string; color: string; thresholds: number[]; weighted: boolean }> = {
  bench: { name: 'Bench press', short: 'BENCH', icon: '▰', color: '#f8ad37', thresholds: [0.5, 0.75, 1, 1.25, 1.5, 1.8], weighted: false },
  squat: { name: 'Back squat', short: 'SQUAT', icon: '◈', color: '#8d7aff', thresholds: [0.75, 1, 1.5, 2, 2.5, 3], weighted: false },
  deadlift: { name: 'Deadlift', short: 'DEADLIFT', icon: '⬡', color: '#fa7366', thresholds: [1, 1.5, 2, 2.5, 3, 3.5], weighted: false },
  ohp: { name: 'Overhead press', short: 'OHP', icon: '↑', color: '#65c8ed', thresholds: [0.35, 0.5, 0.75, 1, 1.25, 1.5], weighted: false },
  dip: { name: 'Weighted dip', short: 'DIP', icon: '⌄', color: '#e878b0', thresholds: [0.05, 0.25, 0.5, 0.75, 1, 1.25], weighted: true },
  pullup: { name: 'Weighted pull-up', short: 'PULL-UP', icon: '⌃', color: '#67d5b1', thresholds: [0.05, 0.15, 0.35, 0.5, 0.75, 1], weighted: true },
}

export const forms = [
  { name: 'Earthling', label: 'The beginning', color: '#8d97a9' },
  { name: 'Saiyan', label: 'Awakened', color: '#f5aa3a' },
  { name: 'Super Saiyan', label: 'Limit broken', color: '#f7d75c' },
  { name: 'Super Saiyan Blue', label: 'Divine power', color: '#62caff' },
  { name: 'Ultra Instinct', label: 'Beyond limits', color: '#c4b9ff' },
  { name: 'Mastered Ultra Instinct', label: 'Perfect control', color: '#ecf5ff' },
  { name: 'Legendary', label: 'Peak form', color: '#76eec0' },
] as const

export function estimatedMax(entry: LiftEntry) {
  const load = entry.weight + (liftInfo[entry.liftId].weighted ? entry.bodyweight : 0)
  const total = entry.reps === 1 ? load : load * (1 + entry.reps / 30)
  return Math.max(0, total - (liftInfo[entry.liftId].weighted ? entry.bodyweight : 0))
}

export function rankThresholds(id:LiftId,bodyweight:number,sex:Profile['sex']='M'){
  return id==='dip'||id==='pullup'?streetThresholds(id,sex,bodyweight):liftInfo[id].thresholds.map(n=>n*bodyweight)
}
export function liftStats(entries: LiftEntry[], id: LiftId, bodyweight: number, sex:Profile['sex']='M') {
  const liftEntries = entries.filter(e => e.liftId === id).reverse().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const latest = liftEntries[0]
  const current = latest ? estimatedMax(latest) : 0
  const best = liftEntries.reduce((max, e) => Math.max(max, estimatedMax(e)), 0)
  const thresholds = rankThresholds(id,bodyweight,sex)
  const rank = latest ? thresholds.filter(t => current >= t).length : 0
  const formIndex = Math.min(rank, forms.length - 1)
  const next = thresholds.find(t => current < t) ?? null
  const previous = rank > 0 ? thresholds[rank - 1] : 0
  const progress = next ? Math.max(0, Math.min(100, ((current - previous) / (next - previous)) * 100)) : 100
  return { latest, current, best, rank: formIndex, next, progress, thresholds, count: liftEntries.length }
}

export function totalStats(entries: LiftEntry[], bodyweight: number) {
  const ids: LiftId[] = ['squat', 'bench', 'deadlift']
  const values = ids.map(id => liftStats(entries, id, bodyweight))
  const complete = values.every(v => v.latest)
  const total = complete ? values.reduce((sum, v) => sum + v.current, 0) : null
  const rank = complete ? Math.floor(values.reduce((sum, v) => sum + v.rank, 0) / values.length) : 0
  const power = Math.round(LIFT_IDS.reduce((sum, id) => sum + liftStats(entries, id, bodyweight).current / Math.max(bodyweight, 1) * 100, 0))
  return { total, rank, power, logged: LIFT_IDS.filter(id => liftStats(entries, id, bodyweight).latest).length }
}

export function displayWeight(value: number, weighted = false) {
  const precision=Number.isInteger(value*4)?100:10
  const rounded = Math.round(value * precision) / precision
  return `${weighted && rounded >= 0 ? '+' : ''}${rounded.toLocaleString('en-US', { maximumFractionDigits: precision===100?2:1 })} kg`
}
