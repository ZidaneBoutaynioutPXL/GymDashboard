import { LIFT_IDS, type LiftEntry, type LiftId, type Profile } from './data'
import { liftStats } from './strength'

export type RankDomain = LiftId | 'body' | 'ultimate'
export const characters: Record<RankDomain, { name: string; asset: string; forms: string[] }> = {
  bench: { name:'Vegeta',asset:'vegeta',forms:['Base','Super Saiyan','Super Saiyan 2','Super Saiyan God','Super Saiyan Blue','Blue Evolution','Ultra Ego'] },
  squat: { name:'Broly',asset:'broly',forms:['Base','Battle ready','Wrathful','Super Saiyan','Full Power','Legendary','Maximum power'] },
  deadlift: { name:'Future Trunks',asset:'trunks',forms:['Base','Super Saiyan','Super Trunks','Super Saiyan 2','Super Saiyan Rage','Sword of Hope','Final strike'] },
  ohp: { name:'Piccolo',asset:'piccolo',forms:['Weighted cape','Combat ready','Giant form','Nail fusion','Kami fusion','Potential Unleashed','Orange Piccolo'] },
  dip: { name:'Gohan',asset:'gohan',forms:['Young warrior','Super Saiyan','Super Saiyan 2','Adult Super Saiyan 2','Ultimate Gohan','Beast','Beast unleashed'] },
  pullup: { name:'Frieza',asset:'frieza',forms:['First form','Second form','Third form','Final form','Full power','Golden Frieza','Black Frieza'] },
  body: { name:'Cell',asset:'cell',forms:['Imperfect','Semi-Perfect','Perfect','Battle ready','Power weighted','Super Perfect','Perfect destruction'] },
  ultimate: { name:'Goku',asset:'goku',forms:['Base','Kaioken','Super Saiyan','Super Saiyan 3','Super Saiyan God','Super Saiyan Blue','Ultra Instinct'] },
}
export const tierColors = ['#95adc6','#ee625f','#ffcf55','#ad85ff','#ff8964','#52d9ff','#e4efff']
export const tierEffects = ['embers','charge','shockwave','lightning','vortex','ascension','cosmic']
export const tierLabels = ['Potential awakens','Power rising','Break your limits','Beyond the breaking point','A new dimension','Divine power','The ultimate form']
export function rankName(domain:RankDomain,rank:number) {return characters[domain].forms[rank]}

// Gameplay milestones, not population percentiles or health targets.
export function bodyStats(profile:Profile) {
  const ffmi = profile.bodyFat === null ? null : profile.bodyweight*(1-profile.bodyFat/100)/(profile.height/100)**2
  const thresholds = profile.sex==='F' ? [14,15.5,17,18.5,20,22] : [17,19,21,23,25,27]
  const rank = ffmi===null ? 0 : thresholds.filter(t=>ffmi>=t).length
  const next = thresholds[rank] ?? null
  const baseline = rank===0 ? 0 : thresholds[rank-1]
  const progress = ffmi===null ? 0 : next===null ? 1 : Math.max(0,Math.min(1,(ffmi-baseline)/(next-baseline)))
  return {ffmi,rank,next,thresholds,score:ffmi===null ? 0 : Math.min(100,(rank+progress)/6*100)}
}
export function ultimateStats(entries:LiftEntry[],profile:Profile) {
  const body=bodyStats(profile)
  const parts=[...LIFT_IDS.map(id=>{const s=liftStats(entries,id,profile.bodyweight,profile.sex);return {id,score:s.latest?Math.min(100,(s.rank+s.progress/100)/6*100):0,present:!!s.latest}}),{id:'body',score:body.score,present:body.ffmi!==null}]
  const score=parts.reduce((sum,p)=>sum+p.score,0)/7
  const coverage=parts.filter(p=>p.present).length
  const rank=Math.min(6,Math.floor((score+1e-8)/100*6))
  return {score,rank,coverage,parts}
}
