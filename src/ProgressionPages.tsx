import { useEffect, useState, type CSSProperties } from 'react'

import { ArrowRight, Check, Gift, Lock, Map, Sparkles, Trophy, Undo2 } from 'lucide-react'

import { CharacterArt } from './CharacterArt'

import { characters, bodyStats, ultimateStats, type RankDomain } from './ranks'

import { LIFT_IDS, type LiftEntry, type Profile, type ProgramDay } from './data'

import { chapters, rewards, type GameState } from './gameTypes'

import { availableRewards, chooseRoomFighter, claimReward, completeNode, equipment, equipReward, gameStats, owned, eligible, startSaga, undoWorkout } from './progression'

import { displayWeight, liftInfo, liftStats } from './strength'

import { playCharacterSound, unlockAudio } from './sound'

import { today } from './utils'



type Props={game:GameState;profile:Profile;entries:LiftEntry[]}

export function ProgressionSummary({game,onOpen}:{game:GameState;onOpen:()=>void}){

  const stats=gameStats(game),saga=game.sagas.at(-1),gifts=availableRewards(game).length

  return <button className="progression-summary" onClick={onOpen}><Map size={24}/><div><span>YOUR TRAINING SAGA</span><strong>{saga?saga.title:'Begin your first chapter'}</strong></div><div className="summary-xp"><strong>LV {stats.level} <small>· {stats.xp} XP</small></strong><span>{gifts?`${gifts} rewards ready to collect`:`${stats.sessions} workouts completed`}</span></div><ArrowRight size={18}/></button>

}



export function SagaPage({game,profile,entries,days,onRoom,onPlan}:{game:GameState;profile:Profile;entries:LiftEntry[];days:ProgramDay[];onRoom:()=>void;onPlan:()=>void}){

  const [title,setTitle]=useState('The Ascension Saga'),[start,setStart]=useState(today()),[selected,setSelected]=useState<number|null>(null)

  const [checked,setChecked]=useState<string[]>([]),[date,setDate]=useState(today()),[note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[award,setAward]=useState('')

  const s=game.sagas.at(-1),stats=gameStats(game),finished=!!s&&s.completed.length===s.days.length*4

  const node=selected??s?.completed.length??0,day=s?.days[node%s.days.length],record=s?.completed[node],current=!!s&&!finished&&node===s.completed.length

  async function act(fn:()=>Promise<unknown>){if(busy)return;setBusy(true);setError('');try{await fn()}catch(e){setError(e instanceof Error?e.message:'Could not save progression.')}finally{setBusy(false)}}

  function choose(n:number){setSelected(n);setChecked([]);setNote('');setError('')}

  return <div className="saga-page"><div className="game-page-heading"><div><div className="eyebrow">YOUR STORY, ONE WORKOUT AT A TIME</div><h1>THE TRAINING <em>SAGA.</em></h1><p>A four-chapter journey through your own program. Your pace. Your rewards.</p></div><button className="outlined-button" onClick={onRoom}><Gift size={16}/> REWARD ROOM {availableRewards(game).length>0&&`(${availableRewards(game).length})`}</button></div>

    <div className="saga-command"><div><span>ADVENTURER LEVEL</span><strong>{stats.level.toString().padStart(2,'0')}</strong></div><div className="saga-xp"><b>{stats.xp} XP <small>/ {(Math.floor(stats.xp/500)+1)*500} next level</small></b><div className="progress-track"><span style={{width:`${stats.progress}%`}}/></div><small>Cosmetic progression · strength ranks come only from your lift and body stats.</small></div><div><span>WORKOUTS</span><strong>{stats.sessions}</strong></div><div><span>SAGAS CLEARED</span><strong>{stats.blocks}</strong></div></div>

    {award&&<div className="saga-award" role="status"><Sparkles size={22}/><div><strong>{award}</strong><span>Your progress is saved. Visit the reward room to collect unlocked items.</span></div><button className="outlined-button" onClick={onRoom}>OPEN REWARDS <ArrowRight size={14}/></button></div>}

    {(!s||finished)&&<section className="saga-start surface-panel"><div><div className="eyebrow">{finished?'THE NEXT CHAPTER IS YOURS':'A NEW ADVENTURE'}</div><h2>{finished?'Start another saga':'Choose your saga'}</h2><p>Each chapter includes every day in your current training plan, in order. Chapter names are story milestones; they do not change your exercise prescription or require a max attempt.</p><p>{days.length} workouts per chapter · {days.length*4} workouts total. A saved copy keeps this saga stable when you edit your program.</p><button className="text-link" onClick={onPlan}>REVIEW TRAINING PLAN <ArrowRight size={14}/></button></div><form onSubmit={e=>{e.preventDefault();void act(async()=>{await startSaga(title,start,days,entries,profile);setSelected(null);setChecked([]);setAward('');})}}><label className="form-field"><span>Saga name</span><input required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="form-field"><span>Saga start date</span><input type="date" required max={today()} value={start} onChange={e=>setStart(e.target.value)}/></label><button className="primary-button" disabled={busy||!days.length}>BEGIN SAGA <ArrowRight size={17}/></button></form></section>}

    {s&&<><div className="saga-map-title"><div><span className="eyebrow">ACTIVE STORY · {s.startDate}</span><h2>{s.title}</h2></div><strong>{s.completed.length} / {s.days.length*4} <small>WORKOUTS</small></strong></div><div className="chapter-map">{chapters.map((chapter,c)=>{const done=Math.min(s.days.length,Math.max(0,s.completed.length-c*s.days.length));return <section className={`chapter-column ${done===s.days.length?'chapter-cleared':''}`} key={chapter.name} style={{'--chapter-color':chapter.color} as CSSProperties}><header><span>CHAPTER 0{c+1}</span><h3>{chapter.name}</h3><p>{chapter.subtitle}</p><small>{done}/{s.days.length} cleared · +150 XP bonus</small></header><div className="chapter-nodes">{s.days.map((d,i)=>{const n=c*s.days.length+i,complete=n<s.completed.length,next=n===s.completed.length;return <button key={`${c}-${d.id}`} className={`saga-node ${complete?'node-complete':next?'node-next':'node-locked'} ${node===n?'node-selected':''}`} disabled={n>s.completed.length||busy} onClick={()=>choose(n)} aria-label={`${complete?'Review':next?'Open':'Locked'} ${chapter.name}: ${d.title}`}><span className="node-orb">{complete?<Check size={16}/>:next?<Sparkles size={16}/>:<Lock size={13}/>}</span><span><strong>{d.title}</strong><small>{complete?s.completed[n].date:next?'YOUR NEXT WORKOUT':'COMPLETE PREVIOUS NODE'}</small></span></button>})}</div><div className="chapter-chest">{done===s.days.length?<Trophy size={18}/>:<Gift size={18}/>} {done===s.days.length?'CHAPTER CLEARED':'CHAPTER REWARD'}</div></section>})}</div>

    {day&&node<s.days.length*4&&<section className="saga-workout surface-panel" key={`${s.id}-${node}`}><div className="panel-heading"><div><div className="eyebrow">{record?'COMPLETED WORKOUT':'NEXT MISSION'} · {chapters[Math.floor(node/s.days.length)].name}</div><h2>{day.title}</h2><p>{day.focus}</p></div><span className="mission-xp">+100 XP</span></div><p className="fine-print">Check the exercises you actually completed. This records program completion; use lift logging for weights, reps, and strength ranks.</p><div className="mission-checklist">{day.exercises.map(ex=><label key={ex.id}><input type="checkbox" checked={!!record||checked.includes(ex.id)} disabled={!current||busy} onChange={e=>setChecked(xs=>e.target.checked?[...xs,ex.id]:xs.filter(x=>x!==ex.id))}/><span><strong>{ex.lift}</strong><small>{ex.sets} sets × {ex.reps} · {ex.target}</small></span></label>)}</div>{record?<div className="mission-record"><strong>Completed {record.date}</strong><p>{record.note||'Another chapter of work recorded.'}</p></div>:<form onSubmit={e=>{e.preventDefault();void act(async()=>{const before=gameStats(game).xp;const next=await completeNode(s.id,node,date,checked,note);const gain=gameStats(next).xp-before;setAward(`MISSION CLEARED · +${gain} XP`);setSelected(null);setChecked([]);setNote('');window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});unlockAudio();playCharacterSound('ultimate','log-0');})}}><div className="form-grid"><label className="form-field"><span>Workout completion date</span><input type="date" min={s.startDate} max={today()} required value={date} onChange={e=>setDate(e.target.value)}/></label><label className="form-field"><span>Session reflection</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="What went well?" maxLength={500}/></label></div><button className="primary-button" disabled={busy||!current||checked.length!==day.exercises.length}><Check size={17}/> COMPLETE WORKOUT</button></form>}</section>}

    {finished&&<section className="saga-recap surface-panel"><Trophy size={32}/><div className="eyebrow">BLOCK COMPLETE · +500 XP</div><h2>SAGA CONQUERED.</h2><p>{s.completed.length} workouts. Four chapters. Your training became a story.</p><div className="recap-lifts">{LIFT_IDS.map(id=>{const now=liftStats(entries,id,profile.bodyweight,profile.sex);return <div key={id}><span>{liftInfo[id].short}</span><strong>{s.baseline[id]===null?'—':displayWeight(s.baseline[id]!)} → {now.latest?displayWeight(now.current):'—'}</strong><small>Baseline → current estimated 1RM</small></div>})}</div><p className="fine-print">Live lift comparison, not a claim that every change was caused by this block.</p></section>}

    {s.completed.length>0&&<button className="outlined-button saga-undo" disabled={busy} onClick={()=>void act(async()=>{await undoWorkout();setSelected(null);setChecked([]);setAward('Last workout undone. XP and reward eligibility recalculated.');})}><Undo2 size={15}/> UNDO LAST WORKOUT</button>}</>}

    {error&&<p className="game-error" role="alert">{error}</p>}<p className="fine-print">100 XP per completed workout, 150 per chapter, 500 per saga. One rewarded workout per calendar day, in date order. Rest days never erase progress. Undo removes the associated XP and makes unearned cosmetics unavailable.</p>

    {game.sagas.length>1&&<section className="surface-panel saga-archive"><h3>Your previous sagas</h3>{game.sagas.slice(0,-1).map(old=><details key={old.id}><summary>{old.title} · {old.completed.length} workouts · {old.startDate}</summary>{old.completed.map(c=><p key={c.node}>{c.date} · {chapters[Math.floor(c.node/old.days.length)].name} · {old.days[c.node%old.days.length].title}{c.note&&` — ${c.note}`}</p>)}</details>)}</section>}

  </div>

}



export function RoomPage({game,profile,entries}:Props){

  const fighter=game.fighter??'ultimate'

  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[reveal,setReveal]=useState<string|null>(null)

  useEffect(()=>{if(!reveal)return;const panel=document.querySelector<HTMLElement>('.reward-reveal');panel?.focus({preventScroll:true});panel?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})},[reveal])
  const loadout=equipment(game),stats=gameStats(game),rank=fighter==='ultimate'?ultimateStats(entries,profile).rank:fighter==='body'?bodyStats(profile).rank:liftStats(entries,fighter,profile.bodyweight,profile.sex).rank

  const collected=rewards.filter(r=>r.kind==='trophy'&&owned(game,r.id)),reward=rewards.find(r=>r.id===reveal)

  async function collect(id:string){if(busy)return;setBusy(true);setError('');try{await claimReward(id);setReveal(id);unlockAudio();playCharacterSound(fighter,'rank-2')}catch(e){setError(e instanceof Error?e.message:'Could not collect reward.')}finally{setBusy(false)}}

  async function equip(id:string){setError('');try{await equipReward(id)}catch(e){setError(e instanceof Error?e.message:'Could not equip reward.')}}

  return <div className="room-page"><div className="game-page-heading"><div><div className="eyebrow">EARN IT. COLLECT IT. MAKE IT YOURS.</div><h1>YOUR TRAINING <em>ROOM.</em></h1><p>Complete saga missions to unlock new spaces, energy auras, frames, and trophies.</p></div><span className="room-level">LV {stats.level} · {stats.xp} XP</span></div>

    <div className={`training-room room-${loadout.room} aura-${loadout.aura} frame-${loadout.frame}`}><div className="room-stars"/><div className="room-window"/><div className="room-floor"/><div className="room-energy"/><CharacterArt domain={fighter} rank={rank}/><div className="room-title"><span>{rewards.find(r=>r.id===loadout.room)?.name}</span><h2>{profile.name}’s domain</h2><small>{rewards.find(r=>r.id===loadout.aura)?.name} · {rewards.find(r=>r.id===loadout.frame)?.name}</small></div><div className="room-trophies">{collected.map(r=><div key={r.id} title={r.name}><Trophy size={24}/><span>{r.name}</span></div>)}{!collected.length&&<span>Your first trophy awaits.</span>}</div></div>

    <div className="room-fighter-picker"><span>ROOM FIGHTER</span>{Object.entries(characters).map(([id,c])=><button className={fighter===id?'active':''} key={id} onClick={()=>void chooseRoomFighter(id as RankDomain).catch(e=>setError(e.message))}>{c.name}</button>)}</div>

    {reward&&<div className="reward-reveal" tabIndex={-1} role="status" key={reward.id}><Gift size={38}/><div><span>NEW REWARD COLLECTED</span><h2>{reward.name}</h2><p>{reward.description}</p></div>{reward.kind!=='trophy'&&<button className="primary-button" onClick={()=>void equip(reward.id)}>EQUIP {reward.kind.toUpperCase()}</button>}<button className="outlined-button" aria-label="Dismiss reward" onClick={()=>setReveal(null)}>CONTINUE</button></div>}

    <div className="reward-section-title"><h2>THE REWARD VAULT</h2><span>{rewards.filter(r=>owned(game,r.id)).length} / {rewards.length} COLLECTED</span></div><div className="reward-grid">{rewards.map(r=>{const has=owned(game,r.id),ready=eligible(game,r.id),equipped=r.kind!=='trophy'&&loadout[r.kind]===r.id;return <article className={`reward-card ${has?'reward-owned':ready?'reward-ready':'reward-locked'}`} key={r.id} style={{'--reward-color':r.color} as CSSProperties}><div className={`reward-art reward-art-${r.kind}`}><span/>{r.kind==='trophy'?<Trophy size={32}/>:r.kind==='room'?<Map size={32}/>:<Sparkles size={32}/>}</div><div className="eyebrow">{r.kind} · {has?'COLLECTED':ready?'READY TO CLAIM':'LOCKED'}</div><h3>{r.name}</h3><p>{r.description}</p><small>{'blocks'in r?`Complete ${r.blocks} ${r.blocks===1?'saga':'sagas'}`:r.xp?`${r.xp} XP`:'Starter cosmetic'}</small>{has?<button className="outlined-button" disabled={equipped||r.kind==='trophy'} onClick={()=>void equip(r.id)}>{equipped?'EQUIPPED':r.kind==='trophy'?'ON DISPLAY':'EQUIP'}</button>:<button className={ready?'primary-button':'outlined-button'} disabled={!ready||busy} onClick={()=>void collect(r.id)}>{ready?<Gift size={14}/>:<Lock size={14}/>} {ready?'COLLECT REWARD':'KEEP TRAINING'}</button>}</article>})}</div>{error&&<p role="alert" className="game-error">{error}</p>}<p className="fine-print">Room and aura choices appear here. Equipped frames also decorate your lift cards. Cosmetics never change your strength ranks.</p></div>

}

