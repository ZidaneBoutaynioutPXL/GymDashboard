import source from './globalBenchmarks.json'
import type { LiftId, Profile } from './data'

export function globalComparison(id:LiftId,profile:Profile,value:number) {
  if(profile.age<18 || (profile.sex!=='M'&&profile.sex!=='F')) return null
  const data=source.lifts[id], rows=data[profile.sex]
  const bw=profile.bodyweight
  if(bw<rows[0][0]||bw>rows[rows.length-1][0])return null
  const hi=rows.findIndex(row=>row[0]>=bw), a=rows[Math.max(0,hi-1)],b=rows[hi]
  const f=a[0]===b[0]?0:(bw-a[0])/(b[0]-a[0])
  const standards=a.slice(1).map((v,i)=>v+(b[i+1]-v)*f)
  const p=source.percentiles
  let percentile:number|null=null
  let label=value<standards[0]?'<5th':'>95th'
  for(let i=0;i<standards.length;i++) {
    if(value===standards[i]){percentile=p[i];break}
    if(i>0&&value<standards[i]&&value>standards[i-1]) {percentile=p[i-1]+(p[i]-p[i-1])*(value-standards[i-1])/(standards[i]-standards[i-1]);break}
  }
  if(percentile!==null)label=`~${Math.round(percentile)}th`
  return {label,percentile,standards,url:data.url,cutoff:data.metadata['Data cutoff']}
}
