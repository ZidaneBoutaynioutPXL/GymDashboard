import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CalendarDays, Target } from 'lucide-react'
import { db, type LiftEntry, type LiftId, type Profile } from './data'
import { newGame, type CoachPlan, type GameState } from './gameTypes'
import { saveCoachPlan } from './progression'
import { displayWeight, estimatedMax, liftInfo, liftStats } from './strength'
import { characters, rankName } from './ranks'
import { today } from './utils'

export function CoachPanel({id,profile,entries}:{id:LiftId;profile:Profile;entries:LiftEntry[]}){
  const state=useLiveQuery(()=>db.game.get('me'),[])
  return <CoachEditor key={`${id}-${JSON.stringify(state?.plans[id])}`} id={id} profile={profile} entries={entries} game={state??newGame()}/>
}
function CoachEditor({id,profile,entries,game}:{id:LiftId;profile:Profile;entries:LiftEntry[];game:GameState}){
  const stats=liftStats(entries,id,profile.bodyweight,profile.sex),weighted=liftInfo[id].weighted
  const [plan,setPlan]=useState<CoachPlan>(game.plans[id]??{date:today(),weight:stats.latest?.weight??0,reps:stats.latest?.reps??5,increment:weighted?1.25:2.5})
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const history=entries.filter(e=>e.liftId===id).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt??'').localeCompare(b.createdAt??'')).slice(-5)
  const s=game.sagas.at(-1),nextDay=s&&s.completed.length<s.days.length*4?s.days[s.completed.length%s.days.length]:null
  const preview=estimatedMax({id:'plan',liftId:id,weight:plan.weight,reps:plan.reps,date:plan.date,note:'',bodyweight:profile.bodyweight})
  return <section className="coach-panel surface-panel"><div className="panel-heading"><div><div className="eyebrow"><Target size={14}/> {characters[id].name.toUpperCase()} · NEXT TRANSFORMATION</div><h2>{stats.next?`${rankName(id,Math.min(stats.rank+1,6))} is your next form`:'Your final form is unlocked'}</h2></div><span className="coach-badge">YOUR NEXT STEP</span></div>
    <div className="coach-targets"><div><span>LATEST {stats.latest?.reps===1?'TRUE':'ESTIMATED'} 1RM</span><strong>{stats.latest?displayWeight(stats.current,weighted):'—'}</strong></div><ArrowRight size={22}/><div><span>{stats.next?'NEXT FORM REQUIRES':'PERSONAL GOAL'}</span><strong>{displayWeight(stats.next??profile.goals[id],weighted)}</strong></div><div><span>{stats.next?'DISTANCE TO FORM':'CURRENT FORM'}</span><strong>{stats.next?stats.latest?`${displayWeight(Math.max(0,stats.next-stats.current))} to go`:'Log your first set':rankName(id,6)}</strong></div></div>
    <div className="progress-track"><span style={{width:`${stats.progress}%`}}/></div><div className="coach-history" aria-label="Recent strength timeline">{history.length?history.map(e=><div key={e.id}><span>{e.date}</span><strong>{displayWeight(estimatedMax(e),weighted)}</strong><small>{e.weight} kg × {e.reps}</small></div>):<p>Your strength timeline starts with your first recorded set.</p>}</div>
    <div className="coach-plan"><div><div className="eyebrow"><CalendarDays size={14}/> PLAN YOUR NEXT SESSION</div><h3>{game.plans[id]?`Saved plan · ${game.plans[id]?.date}`:'Turn the target into a next step'}</h3><p>{nextDay?`Next saga workout: ${nextDay.title}. Check its exercise list when planning this lift.`:'Set your own next session date, load, and reps.'}</p><p className="fine-print">The increment button adds your chosen amount to your last logged working weight. This is editable planning arithmetic, not a readiness assessment or a predicted date for unlocking a form.</p></div><form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{await saveCoachPlan(id,plan);setMessage('Next session saved.')}catch(err){setMessage(err instanceof Error?err.message:'Could not save plan.')}finally{setBusy(false)}}}><div className="form-grid"><label className="form-field"><span>Next session date</span><input type="date" required value={plan.date} onChange={e=>setPlan({...plan,date:e.target.value})}/></label><label className="form-field"><span>{weighted?'Planned added weight (kg)':'Planned weight (kg)'}</span><input type="number" min="0" step=".25" required value={plan.weight} onChange={e=>setPlan({...plan,weight:Number(e.target.value)})}/></label><label className="form-field"><span>Planned reps</span><input type="number" min="1" max="30" required value={plan.reps} onChange={e=>setPlan({...plan,reps:Number(e.target.value)})}/></label><label className="form-field"><span>Chosen increment (kg)</span><input type="number" min="0" max="20" step=".25" required value={plan.increment} onChange={e=>setPlan({...plan,increment:Number(e.target.value)})}/></label></div><button className="outlined-button" type="button" disabled={!stats.latest} onClick={()=>setPlan({...plan,weight:Math.round(((stats.latest?.weight??0)+plan.increment)*100)/100})}>USE LAST SET + INCREMENT</button><p className="fine-print">Planned {plan.reps===1?'true':'estimated'} 1RM: {displayWeight(preview,weighted)}. A plan never updates your earned rank.</p><button className="primary-button" disabled={busy}>SAVE NEXT SESSION</button>{message&&<p role="status">{message}</p>}</form></div>
  </section>
}
