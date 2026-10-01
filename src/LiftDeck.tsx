import { useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { LIFT_IDS, type LiftEntry, type LiftId, type Profile } from './data'
import { CharacterArt } from './RankUI'
import { characters, rankName } from './ranks'
import { liftInfo, liftStats } from './strength'
import { preloadCharacterSound, unlockAudio } from './sound'
import { LiftEntrance } from './LiftEntrance'

export function LiftDeck({profile,entries,onOpen,hidden,onRestore}:{profile:Profile;entries:LiftEntry[];onOpen:(id:LiftId)=>void;hidden:LiftId[];onRestore:(id:LiftId)=>void}){
  const [opening,setOpening]=useState<LiftId|null>(null),reduced=useReducedMotion()
  function open(id:LiftId){if(opening)return;unlockAudio();if(reduced){onOpen(id);return}setOpening(id)}
  return <><div className="deck-heading"><div><div className="eyebrow"><Sparkles size={14}/> YOUR WARRIOR COLLECTION</div><h1>CHOOSE YOUR<br/><em>PATH TO POWER.</em></h1><p>Every lift has a fighter. Open a card to enter its world.</p></div><div className="deck-count"><strong>{6-hidden.length}<span>/ 06</span></strong><small>ACTIVE LIFT CARDS</small></div></div><div className={`warrior-deck ${opening?'deck-opening':''}`} aria-busy={!!opening}>{LIFT_IDS.filter(id=>!hidden.includes(id)).map((id,i)=>{
    const s=liftStats(entries,id,profile.bodyweight,profile.sex)
    return <button key={id} className={`warrior-card ${opening===id?'card-opening':''}`} aria-label={`Open ${liftInfo[id].name}`} disabled={!!opening} onClick={()=>open(id)} onPointerEnter={()=>preloadCharacterSound(id)} onFocus={()=>preloadCharacterSound(id)} style={{'--card-color':liftInfo[id].color,'--card-index':i} as CSSProperties}><div className="card-foil"/><div className="card-frame"/><div className="card-topline"><span>ASCEND // {String(LIFT_IDS.indexOf(id)+1).padStart(2,'0')}</span><b>✦</b></div><CharacterArt domain={id} rank={s.rank}/><div className="card-energy"/><div className="card-copy"><span className="card-character">{characters[id].name}</span><h2>{liftInfo[id].name}</h2><div className="card-form">{s.latest?rankName(id,s.rank):'YOUR STORY STARTS HERE'}</div><div className="card-open-label">OPEN YOUR LIFT <ArrowRight size={16}/></div></div></button>
  })}</div>{opening&&<LiftEntrance id={opening} rank={liftStats(entries,opening,profile.bodyweight,profile.sex).rank} onEnter={()=>onOpen(opening)} onCancel={()=>setOpening(null)}/>}{hidden.length>0&&<section className="deck-restore"><span>Removed from your collection</span>{hidden.map(id=><button className="outlined-button" key={id} onClick={()=>onRestore(id)}><RotateCcw size={13}/> Restore {liftInfo[id].name}</button>)}<small>Recorded sets stay saved when a card is removed.</small></section>}</>
}
export function LiftBack({onBack}:{onBack:()=>void}){return <button className="deck-back" onClick={onBack}><ArrowLeft size={16}/> BACK TO YOUR CARDS</button>}
