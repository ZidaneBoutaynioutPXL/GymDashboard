import { db, LIFT_IDS, type LiftEntry, type LiftId, type Profile, type ProgramDay } from './data'
import { newGame, rewards, validateGame, validDate, type CoachPlan, type GameState } from './gameTypes'
import { liftStats } from './strength'
import type { RankDomain } from './ranks'
import { today, uid } from './utils'

export function gameStats(g:GameState){
  const sessions=g.sagas.reduce((n,s)=>n+s.completed.length,0)
  const chapters=g.sagas.reduce((n,s)=>n+Math.floor(s.completed.length/s.days.length),0)
  const blocks=g.sagas.filter(s=>s.completed.length===s.days.length*4).length
  const xp=sessions*100+chapters*150+blocks*500
  return {sessions,chapters,blocks,xp,level:Math.floor(xp/500)+1,progress:xp%500/5}
}
export function eligible(g:GameState,id:string){const r=rewards.find(r=>r.id===id);if(!r)return false;const stats=gameStats(g);return stats.xp>=r.xp&&(!('blocks'in r)||stats.blocks>=r.blocks)}
export function owned(g:GameState,id:string){const r=rewards.find(r=>r.id===id);return !!r&&eligible(g,id)&&(r.xp===0&&!('blocks'in r)||g.claimed.includes(id))}
export function equipment(g:GameState){const defaults=newGame().equipment;return Object.fromEntries(Object.entries(g.equipment).map(([kind,id])=>[kind,owned(g,id)?id:defaults[kind as keyof typeof defaults]])) as GameState['equipment']}
export function availableRewards(g:GameState){return rewards.filter(r=>eligible(g,r.id)&&!owned(g,r.id))}
export async function changeGame(change:(game:GameState)=>void){return db.transaction('rw',db.game,async()=>{const g=await db.game.get('me')??newGame();change(g);validateGame(g);await db.game.put(g);return g})}
export async function startSaga(title:string,startDate:string,days:ProgramDay[],entries:LiftEntry[],profile:Profile){
  return changeGame(g=>{
    const last=g.sagas.at(-1)
    if(last&&last.completed.length<last.days.length*4)throw Error('Finish your current saga before starting the next one.')
    if(!title.trim()||!validDate(startDate)||startDate>today()||!days.length||days.some(d=>!d.exercises.length))throw Error('Choose a title, a start date up to today, and a program with exercises in every day.')
    if(last&&startDate<last.completed.at(-1)!.date)throw Error('The next saga must start after your previous training block.')
    g.sagas.push({id:uid(),title:title.trim(),startDate,days:structuredClone(days),completed:[],baseline:Object.fromEntries(LIFT_IDS.map(id=>{const stats=liftStats(entries,id,profile.bodyweight,profile.sex);return [id,stats.latest?stats.current:null]})) as Record<LiftId,number|null>})
  })
}
export async function completeNode(sagaId:string,node:number,date:string,checked:string[],note:string){return changeGame(g=>{
  const s=g.sagas.at(-1)
  if(!s||s.id!==sagaId||s.completed.length!==node||node>=s.days.length*4)throw Error('This workout is already completed or is not the next node.')
  if(!validDate(date)||date>today()||date<s.startDate)throw Error('Choose a workout date between the saga start and today.')
  const latest=g.sagas.flatMap(s=>s.completed).at(-1)
  if(latest&&date<=latest.date)throw Error('Saga progress rewards one workout per calendar day. Choose a later completed workout date; rest days never reset progress.')
  const required=s.days[node%s.days.length].exercises.map(e=>e.id)
  if(checked.length!==required.length||!required.every(id=>checked.includes(id)))throw Error('Check every exercise you completed before finishing this workout.')
  s.completed.push({node,date,checked:[...checked],note:note.trim()})
})}
export async function undoWorkout(){return changeGame(g=>{const s=g.sagas.at(-1);if(!s?.completed.length)throw Error('No workout to undo in this saga.');s.completed.pop();g.equipment=equipment(g)})}
export async function claimReward(id:string){return changeGame(g=>{if(!eligible(g,id)||owned(g,id))throw Error('This reward is locked or already collected.');g.claimed.push(id)})}
export async function equipReward(id:string){return changeGame(g=>{const r=rewards.find(r=>r.id===id);if(!r||r.kind==='trophy'||!owned(g,id))throw Error('Collect this cosmetic before equipping it.');g.equipment[r.kind]=id})}
export async function saveCoachPlan(id:LiftId,plan:CoachPlan){return changeGame(g=>{g.plans[id]=plan})}

export async function chooseRoomFighter(fighter:RankDomain){return changeGame(g=>{g.fighter=fighter})}
