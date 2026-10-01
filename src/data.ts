import { newGame, validateGame, type GameState } from './gameTypes'
import Dexie, { type Table } from 'dexie'
import { isNative, shareBackup } from './native'

export const LIFT_IDS = ['bench', 'squat', 'deadlift', 'ohp', 'dip', 'pullup'] as const
export type LiftId = typeof LIFT_IDS[number]
export type NoteCategory = 'Training' | 'Strength' | 'Nutrition' | 'Mindset'

export type Profile = {
  id: 'me'
  configured?: boolean
  name: string
  age: number
  bodyweight: number
  height: number
  bodyFat: number | null
  sex: 'M' | 'F' | 'Mx' | ''
  goals: Record<LiftId, number>
}

export type LiftEntry = {
  id: string
  liftId: LiftId
  weight: number
  reps: number
  date: string
  bodyweight: number
  note: string
  createdAt?: string
}

export type Note = {
  id: string
  category: NoteCategory
  title: string
  content: string
  updatedAt: string
}

export type ProgramExercise = { id: string; lift: string; sets: number; reps: string; target: string }
export type ProgramDay = { id: string; dayIndex: number; title: string; focus: string; exercises: ProgramExercise[] }
export type Measurement = { id: string; date: string; bodyweight: number; bodyFat: number | null; waist: number | null; createdAt?: string }
type Setting = { key: string; value: string }

class TrainingDatabase extends Dexie {
  profiles!: Table<Profile, string>
  entries!: Table<LiftEntry, string>
  notes!: Table<Note, string>
  days!: Table<ProgramDay, string>
  measurements!: Table<Measurement, string>
  settings!: Table<Setting, string>
  game!: Table<GameState, string>

  constructor() {
    super('ascend-training-v1')
    this.version(1).stores({
      profiles: 'id',
      entries: 'id,liftId,date',
      notes: 'id,category,updatedAt',
      days: 'id,dayIndex',
      measurements: 'id,date',
    })
    this.version(2).stores({ settings: 'key' })
    this.version(3).stores({ game: 'id' })
  }
}

export const db = new TrainingDatabase()

export const defaultProfile: Profile = {
  id: 'me', name: 'Warrior', age: 25, bodyweight: 80, height: 178, bodyFat: null, sex: '',
  goals: { bench: 100, squat: 140, deadlift: 180, ohp: 70, dip: 50, pullup: 35 },
}

export const starterDays: ProgramDay[] = [
  { id: 'day-1', dayIndex: 0, title: 'Upper power', focus: 'Push + pull strength', exercises: [
    { id: 'ex-1', lift: 'Bench press', sets: 4, reps: '4–6', target: 'RPE 8' },
    { id: 'ex-2', lift: 'Weighted pull-up', sets: 4, reps: '4–6', target: 'RPE 8' },
    { id: 'ex-3', lift: 'Overhead press', sets: 3, reps: '6–8', target: 'RPE 7' },
  ] },
  { id: 'day-2', dayIndex: 1, title: 'Lower power', focus: 'Squat focus', exercises: [
    { id: 'ex-4', lift: 'Back squat', sets: 4, reps: '4–6', target: 'RPE 8' },
    { id: 'ex-5', lift: 'Romanian deadlift', sets: 3, reps: '6–8', target: 'RPE 7' },
  ] },
  { id: 'day-3', dayIndex: 2, title: 'Upper volume', focus: 'Hypertrophy + skill', exercises: [
    { id: 'ex-6', lift: 'Weighted dip', sets: 4, reps: '6–10', target: 'RPE 8' },
    { id: 'ex-7', lift: 'Incline press', sets: 3, reps: '8–12', target: 'RPE 7' },
    { id: 'ex-8', lift: 'Chest-supported row', sets: 4, reps: '8–12', target: 'RPE 8' },
  ] },
  { id: 'day-4', dayIndex: 3, title: 'Lower pull', focus: 'Deadlift focus', exercises: [
    { id: 'ex-9', lift: 'Deadlift', sets: 3, reps: '3–5', target: 'RPE 8' },
    { id: 'ex-10', lift: 'Front squat', sets: 3, reps: '6–8', target: 'RPE 7' },
  ] },
]

export async function ensureStarterData() {
  await db.transaction('rw', db.profiles, db.days, db.settings, async () => {
    if (await db.settings.get('initialized')) return
    if (!(await db.profiles.get('me'))) await db.profiles.add(defaultProfile)
    if ((await db.days.count()) === 0) await db.days.bulkAdd(starterDays)
    await db.settings.put({ key: 'initialized', value: 'true' })
  })
}

export async function exportData() {
  const payload = {
    format: 'ascend-training', version: 2, exportedAt: new Date().toISOString(),
    profile: await db.profiles.get('me'),
    entries: await db.entries.toArray(),
    notes: await db.notes.toArray(),
    days: await db.days.toArray(),
    measurements: await db.measurements.toArray(),
    game: await db.game.get('me') ?? newGame(),
  }
  const contents=JSON.stringify(payload,null,2)
  const filename=`ascend-backup-${new Date().toISOString().slice(0,10)}.json`
  if(isNative){await shareBackup(filename,contents);return}
  const blob = new Blob([contents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ascend-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importData(file: File) {
  const data: unknown = JSON.parse(await file.text())
  if (!data || typeof data !== 'object' || !('format' in data) || data.format !== 'ascend-training' ||
      !('version' in data) || ![1,2].includes(data.version as number) || !('profile' in data) || !('entries' in data) ||
      !('notes' in data) || !('days' in data) || !('measurements' in data)) throw new Error('This is not an Ascend backup.')
  const backup = data as { profile: Profile; entries: LiftEntry[]; notes: Note[]; days: ProgramDay[]; measurements: Measurement[]; game?:GameState }
  if (!backup.profile || !Array.isArray(backup.entries) || !Array.isArray(backup.notes) || !Array.isArray(backup.days) || !Array.isArray(backup.measurements)) throw new Error('The backup is incomplete.')
  const finite = (value: unknown, min = 0) => typeof value === 'number' && Number.isFinite(value) && value >= min
  const text = (value: unknown) => typeof value === 'string'
  const date = (value: unknown) => text(value) && /^\d{4}-\d{2}-\d{2}$/.test(value as string) && Number.isFinite(Date.parse(value as string))
  const unique = (rows: { id: string }[]) => rows.every(row => row && text(row.id) && row.id.length > 0) && new Set(rows.map(row => row.id)).size === rows.length
  const p = backup.profile
  if (p.id !== 'me' || !text(p.name) || !p.name.trim() || !finite(p.age,13) || p.age > 120 || !finite(p.bodyweight,1) || !finite(p.height,1) || !['','M','F','Mx'].includes(p.sex) || !(p.bodyFat === null || finite(p.bodyFat) && p.bodyFat <= 100) || !LIFT_IDS.every(id => finite(p.goals?.[id]))) throw new Error('Invalid profile in backup.')
  if (!unique(backup.entries) || !backup.entries.every(e => LIFT_IDS.includes(e.liftId) && finite(e.weight) && finite(e.reps,1) && Number.isInteger(e.reps) && e.reps <= 30 && date(e.date) && finite(e.bodyweight,1) && text(e.note))) throw new Error('Invalid lift data in backup.')
  if (!unique(backup.notes) || !backup.notes.every(note => ['Training','Strength','Nutrition','Mindset'].includes(note.category) && text(note.title) && text(note.content) && text(note.updatedAt))) throw new Error('Invalid notes in backup.')
  if (!unique(backup.days) || !backup.days.every(day => finite(day.dayIndex) && text(day.title) && text(day.focus) && Array.isArray(day.exercises) && unique(day.exercises) && day.exercises.every(ex => text(ex.lift) && finite(ex.sets,1) && text(ex.reps) && text(ex.target)))) throw new Error('Invalid program in backup.')
  if (!unique(backup.measurements) || !backup.measurements.every(m => date(m.date) && finite(m.bodyweight,1) && (m.bodyFat === null || finite(m.bodyFat) && m.bodyFat <= 100) && (m.waist === null || finite(m.waist)))) throw new Error('Invalid measurements in backup.')
  const game = data.version === 2 ? validateGame(backup.game) : newGame()
  await db.transaction('rw', [db.profiles, db.entries, db.notes, db.days, db.measurements, db.game], async () => {
    await Promise.all([db.profiles.clear(), db.entries.clear(), db.notes.clear(), db.days.clear(), db.measurements.clear()])
    await db.game.put(game)
    await db.profiles.put(backup.profile)
    await db.entries.bulkPut(backup.entries)
    await db.notes.bulkPut(backup.notes)
    await db.days.bulkPut(backup.days)
    await db.measurements.bulkPut(backup.measurements)
  })
}
