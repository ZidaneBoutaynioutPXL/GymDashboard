import strengthData from './benchmarks.json'
import bodyData from './bodyReference.json'
import type { Profile } from './data'

type Curve = { n: number; q: number[] }
type StrengthCohort = Partial<Record<'squat' | 'bench' | 'deadlift' | 'total', Curve>>

const strengthCohorts = strengthData.cohorts as Record<string, StrengthCohort>
const bodyCohorts = bodyData.cohorts as Record<string, Curve>

function ageBand(age: number, bands: [number, number][]) {
  const match = bands.find(([low, high]) => age >= low && age <= high)
  return match ? `${match[0]}-${match[1]}` : null
}

export function strengthCohort(profile: Profile) {
  if (!profile.sex || profile.bodyweight < 35 || profile.bodyweight >= 200) return null
  const age = ageBand(profile.age, [[18,24],[25,34],[35,44],[45,54],[55,64],[65,99]])
  if (!age) return null
  const weight = Math.min(190, Math.floor(profile.bodyweight / 10) * 10)
  const cohort = strengthCohorts[`${profile.sex}|${age}|${weight}`]
  return cohort ? { age, weight: `${weight}–${weight+9.9}`, curves: cohort } : null
}

export function bodyCohort(profile: Profile) {
  if (profile.sex !== 'M' && profile.sex !== 'F') return null
  const age = ageBand(profile.age, [[18,24],[25,34],[35,44],[45,54],[55,59]])
  if (!age) return null
  const weight = Math.floor(profile.bodyweight / 20) * 20
  const curve = bodyCohorts[`${profile.sex}|${age}|${weight}`]
  return curve ? { age, weight: `${weight}–${weight+19.9}`, curve } : null
}

export function percentile(value: number, curve: Curve) {
  const q = curve.q
  if (value <= q[0]) return 0
  if (value >= q[q.length-1]) return 100
  for (let index=1; index<q.length; index++) {
    if (value <= q[index]) {
      const fraction = q[index]===q[index-1] ? 1 : (value-q[index-1])/(q[index]-q[index-1])
      return Math.round(((index-1)+fraction)*5)
    }
  }
  return 100
}
