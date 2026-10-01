import data from './streetBenchmarks.json'
import type { Profile } from './data'
export type StreetLift='dip'|'pullup'
type Curve={n:number;q:number[];meets:number}
export function streetReference(id:StreetLift,sex:Profile['sex'],bw:number,pooled=false){
  if(sex!=='M'&&sex!=='F')return null
  const group=data.cohorts[sex],band=Math.floor(bw/10)*10
  const bands=group.bands as Record<string,Partial<Record<StreetLift,Curve>>>
  const matched=!pooled?bands[String(band)]?.[id]:undefined
  const curve=matched??group.pooled[id]
  return {curve,band:matched?`${band}–<${band+10} kg`:'All bodyweights',pooled:!matched,sex,source:'https://openstreetlifting.org/',cutoff:data.cutoff}
}
export function streetThresholds(id:StreetLift,sex:Profile['sex'],bw:number){
  const ref=streetReference(id,sex==='F'?'F':'M',bw,true)!
  return data.rankPercentiles.map(p=>Math.ceil(ref.curve.q[data.percentiles.indexOf(p)]*bw/1.25)*1.25)
}
export function streetComparison(id:StreetLift,profile:Profile,added:number){
  const ref=streetReference(id,profile.sex,profile.bodyweight)
  if(!ref||profile.age<18)return null
  const ratio=added/profile.bodyweight,q=ref.curve.q,p=data.percentiles
  let percentile=0
  if(ratio>=q[q.length-1])percentile=100
  else for(let i=1;i<q.length;i++)if(ratio<=q[i]){percentile=q[i]===q[i-1]?p[i] : p[i-1]+(p[i]-p[i-1])*(ratio-q[i-1])/(q[i]-q[i-1]);break}
  percentile=Math.max(0,Math.min(100,percentile))
  return {...ref,percentile,label:percentile<1?'<1st':percentile>99?'>99th':`~${Math.round(percentile)}th`,median:q[p.indexOf(50)]*profile.bodyweight}
}
