import type { RankDomain } from './ranks'
import type { LiftId, ProgramDay } from './data'

export type SagaCompletion={node:number;date:string;note:string;checked:string[]}
export type Saga={id:string;title:string;startDate:string;days:ProgramDay[];completed:SagaCompletion[];baseline:Record<LiftId,number|null>}
export type CoachPlan={date:string;weight:number;reps:number;increment:number}
export type GameState={id:'me';fighter?:RankDomain;sagas:Saga[];claimed:string[];equipment:{room:string;aura:string;frame:string};plans:Partial<Record<LiftId,CoachPlan>>}
export const newGame=():GameState=>({id:'me',sagas:[],claimed:[],equipment:{room:'earth',aura:'calm',frame:'standard'},plans:{}})
export const chapters=[
  {name:'Foundation',subtitle:'Build your rhythm',color:'#72d8b2'},
  {name:'Strength Arc',subtitle:'Make the work count',color:'#6dcaff'},
  {name:'Peak Week',subtitle:'Refine your power',color:'#c798ff'},
  {name:'Test Day',subtitle:'Reflect. Record. Evolve.',color:'#ffcd70'},
]
export const rewards=[
  {id:'earth',kind:'room',name:'Earth Dojo',xp:0,color:'#77cdaa',description:'Your first training ground.'},
  {id:'calm',kind:'aura',name:'Quiet Potential',xp:0,color:'#94aec9',description:'The calm before the ascent.'},
  {id:'standard',kind:'frame',name:'Initiate',xp:0,color:'#637e9c',description:'Every collection starts here.'},
  {id:'spark',kind:'aura',name:'Saiyan Spark',xp:100,color:'#ffca55',description:'Golden energy surrounds your fighter.'},
  {id:'first-step',kind:'trophy',name:'First Step',xp:100,color:'#ffca55',description:'Your first saga workout, completed.'},
  {id:'bronze',kind:'frame',name:'Warrior Bronze',xp:300,color:'#dba077',description:'A forged frame for every lift card.'},
  {id:'gravity',kind:'room',name:'Gravity Chamber',xp:500,color:'#ff798a',description:'A crimson chamber built for focus.'},
  {id:'blue-fire',kind:'aura',name:'Divine Blue',xp:900,color:'#6fddff',description:'A cool blue aura for your training room.'},
  {id:'prism',kind:'frame',name:'Prismatic Legend',xp:1500,color:'#ceacff',description:'Iridescent edges across your card collection.'},
  {id:'time-room',kind:'room',name:'Hyperbolic Chamber',xp:2200,color:'#e1d9ff',description:'A luminous horizon beyond ordinary time.'},
  {id:'saga-master',kind:'trophy',name:'Saga Conqueror',xp:0,blocks:1,color:'#ffe188',description:'One complete training saga. A permanent story to revisit.'},
  {id:'instinct',kind:'aura',name:'Silver Instinct',xp:5000,color:'#e1f5ff',description:'A silver halo earned through sustained training.'},
  {id:'celestial',kind:'frame',name:'Celestial Champion',xp:7500,color:'#ffe3a1',description:'A gilded constellation around your lift collection.'},
  {id:'three-sagas',kind:'trophy',name:'A Warrior’s Legacy',xp:0,blocks:3,color:'#c4c1ff',description:'Three training sagas, written through consistent effort.'},
  {id:'void',kind:'room',name:'World of Void',xp:10000,color:'#b2a7ff',description:'A cosmic training ground for the long journey ahead.'},
] as const
export function validDate(v:unknown):v is string{return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v}

// Backups are untrusted: reject invalid references, duplicate sessions and nonfinite plans.
export function validateGame(raw:unknown):GameState{
  const fail=()=>{throw Error('Invalid progression data in backup.')}
  if(!raw||typeof raw!=='object')return fail()
  const g=raw as GameState,ids=['bench','squat','deadlift','ohp','dip','pullup'] as LiftId[]
  const finite=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0
  const str=(x:unknown)=>typeof x==='string'
  if(g.fighter!==undefined&&![...ids,'body','ultimate'].includes(g.fighter))return fail()
  if(g.id!=='me'||!Array.isArray(g.sagas)||!Array.isArray(g.claimed)||!g.equipment||!g.plans||typeof g.plans!=='object'||Array.isArray(g.plans))return fail()
  if(new Set(g.claimed).size!==g.claimed.length||g.claimed.some(id=>!rewards.some(r=>r.id===id)))return fail()
  for(const kind of ['room','aura','frame'] as const)if(!rewards.some(r=>r.kind===kind&&r.id===g.equipment[kind]))return fail()
  const sagaIds=new Set<string>(),dates=new Set<string>();let lastDate=''
  for(const [index,s] of g.sagas.entries()){
    if(!s||!str(s.id)||!s.id||sagaIds.has(s.id)||!str(s.title)||!s.title.trim()||!validDate(s.startDate)||!Array.isArray(s.days)||!s.days.length||!Array.isArray(s.completed)||!ids.every(id=>s.baseline?.[id]===null||finite(s.baseline?.[id])))return fail()
    sagaIds.add(s.id)
    if(new Set(s.days.map(d=>d?.id)).size!==s.days.length)return fail()
    for(const d of s.days){if(!d||!str(d.id)||!str(d.title)||!str(d.focus)||!finite(d.dayIndex)||!Array.isArray(d.exercises)||!d.exercises.length)return fail();const exIds=new Set<string>();for(const e of d.exercises){if(!e||!str(e.id)||exIds.has(e.id)||!str(e.lift)||!e.lift.trim()||!Number.isInteger(e.sets)||e.sets<1||!str(e.reps)||!str(e.target))return fail();exIds.add(e.id)}}
    if(s.completed.length>s.days.length*4||(index<g.sagas.length-1&&s.completed.length!==s.days.length*4))return fail()
    for(const [i,c] of s.completed.entries()){
      const required=s.days[i%s.days.length].exercises.map(e=>e.id)
      if(!c||c.node!==i||!validDate(c.date)||c.date<s.startDate||c.date<=lastDate||dates.has(c.date)||!str(c.note)||!Array.isArray(c.checked)||c.checked.length!==required.length||new Set(c.checked).size!==required.length||!required.every(id=>c.checked.includes(id)))return fail()
      dates.add(c.date);lastDate=c.date
    }
  }
  for(const [id,p] of Object.entries(g.plans)){if(!ids.includes(id as LiftId)||!p||!validDate(p.date)||!finite(p.weight)||!finite(p.increment)||p.increment>20||!Number.isInteger(p.reps)||p.reps<1||p.reps>30)return fail()}
  return g
}
