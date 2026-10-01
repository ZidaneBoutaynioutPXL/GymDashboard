import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowRight, Play, Volume2, VolumeX } from 'lucide-react'
import { characters, rankName, tierColors, tierEffects, tierLabels, bodyStats, ultimateStats, type RankDomain } from './ranks'
import { liftInfo, displayWeight, liftStats } from './strength'
import { StreetPanel } from './StreetPanel'
import { globalComparison } from './global'
import type { LiftEntry, LiftId, Profile } from './data'
import { playRankSound, setSoundVolume, soundVolume, stopRankSound } from './sound'
import { FinalFormReveal } from './FinalFormReveal'
import { CharacterArt } from './CharacterArt'
export { CharacterArt } from './CharacterArt'

export function RankGallery({domain,rank,reveal}:{domain:RankDomain;rank:number;reveal:(rank:number,domain:RankDomain,preview?:boolean)=>void}) {
  return <section className="surface-panel evolution-gallery"><div className="panel-heading"><div><div className="eyebrow muted">{characters[domain].name.toUpperCase()} · SEVEN STAGES</div><h3>Explore every form</h3></div><span className="small-count">PREVIEW ANY TIER</span></div><div className="evolution-cards">{characters[domain].forms.map((name,i)=><button key={name} className={`evolution-card ${i===rank?'current':''}`} onClick={()=>reveal(i,domain,true)} style={{'--tier':tierColors[i]} as CSSProperties}><CharacterArt domain={domain} rank={i}/><span className="evolution-number">0{i+1}</span><strong>{name}</strong><small>{i===rank?'CURRENT TIER':i<rank?'SURPASSED':'PREVIEW'} <Play size={10}/></small></button>)}</div><p className="fine-print">These are custom game stages, including powered-up poses. Previews never change your earned rank.</p></section>
}
export function RankReveal({domain,rank,preview,onDone}:{domain:RankDomain;rank:number;preview:boolean;onDone:()=>void}) {
  const [volume,setVolume]=useState(soundVolume),[replay,setReplay]=useState(0)
  useEffect(()=>{if(rank!==6)playRankSound(rank,domain);return stopRankSound},[rank,domain,replay])
  function changeVolume(value:number){setVolume(value);setSoundVolume(value);if(!value)stopRankSound()}
  if(rank===6)return <FinalFormReveal domain={domain} preview={preview} volume={volume} onVolume={changeVolume} onDone={onDone}/>
  return <div key={replay} className={`rank-reveal effect-${tierEffects[rank]}`} style={{'--rank-color':tierColors[rank],'--intensity':rank+1} as CSSProperties} data-rank={rank} data-domain={domain}>
    <div className="reveal-grid"/><div className="reveal-halo"/><div className="reveal-ring ring-one"/><div className="reveal-ring ring-two"/><div className="reveal-bolts"/>
    <div className="reveal-particles" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*37)%100}%`,'--delay':`${i%7*.12}s`} as CSSProperties}/>)}</div>
    <div className="reveal-art"><CharacterArt domain={domain} rank={rank}/></div><div className="reveal-slash"/>
    <div className="reveal-top"><span>{preview?'FORM PREVIEW':'YOUR CURRENT FORM'}</span><strong>LEVEL 0{rank+1}</strong></div>
    <div className="reveal-copy"><span className="reveal-character">{characters[domain].name}</span><h2>{rankName(domain,rank).toUpperCase()}</h2><p>{tierLabels[rank]}</p><div className="reveal-controls"><button className="hero-button" onClick={onDone}>KEEP ASCENDING <ArrowRight size={17}/></button><button className="icon-button" aria-label="Replay reveal" onClick={()=>setReplay(v=>v+1)}><Play size={18}/></button></div><div className="sound-controls"><button aria-label={volume?'Mute rank sounds':'Enable rank sounds'} onClick={()=>changeVolume(volume?0:.35)}>{volume?<Volume2 size={16}/>:<VolumeX size={16}/>}</button><label>REVEAL VOLUME<input aria-label="Rank sound volume" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>changeVolume(Number(e.target.value))}/></label></div></div>
  </div>
}
export function LiftMetric({id,profile,entries}:{id:LiftId;profile:Profile;entries:LiftEntry[]}) {
  const stats=liftStats(entries,id,profile.bodyweight,profile.sex),bw=stats.latest?.bodyweight??profile.bodyweight
  const comparison=stats.latest?globalComparison(id,profile,stats.current):null
  if(id==='dip'||id==='pullup')return <><StreetPanel id={id} profile={profile} entries={entries}/><section className="surface-panel lift-metrics"><div><span>ADDED 1RM / SESSION BW</span><strong>{stats.latest?`${(stats.current/bw).toFixed(2)}×`:"—"}</strong><small>{bw} kg session bodyweight</small></div><div><span>TOTAL SYSTEM 1RM</span><strong>{stats.latest?displayWeight(stats.current+bw):"—"}</strong><small>Session bodyweight + estimated added max</small></div></section></>
  return <section className="surface-panel lift-metrics"><div><span>GLOBAL COMMUNITY</span><strong>{comparison?.label??'—'}</strong><small>{comparison?'Estimated percentile at your profile bodyweight':'Requires a log, adult M/F category and supported bodyweight'}</small></div><div><span>{liftInfo[id].weighted?'ADDED 1RM / SESSION BW':'1RM / SESSION BW'}</span><strong>{stats.latest?`${(stats.current/bw).toFixed(2)}×`:'—'}</strong><small>Using {bw} kg session bodyweight</small></div>{liftInfo[id].weighted&&<div><span>TOTAL SYSTEM 1RM</span><strong>{stats.latest?displayWeight(stats.current+bw):'—'}</strong><small>Estimated added max + session bodyweight</small></div>}<p className="fine-print">Reference: <a href={`https://strengthlevel.com/strength-standards/${{bench:'bench-press',squat:'squat',deadlift:'deadlift',ohp:'shoulder-press',dip:'dips',pullup:'pull-ups'}[id]}/kg`} target="_blank" rel="noreferrer">Strength Level</a>. Community lifters, not the general population. Bodyweight interpolation; not age-adjusted. Tail results are capped at &lt;5th / &gt;95th.</p></section>
}
export function BodyRank({profile,reveal}:{profile:Profile;reveal:(rank:number,domain:RankDomain,preview?:boolean)=>void}){
  const body=bodyStats(profile)
  return <><section className="surface-panel ffmi-panel"><CharacterArt domain="body" rank={body.rank}/><div><div className="eyebrow">CELL · BODY COMPOSITION</div><h2>{body.ffmi===null?'Add body fat to unlock':rankName('body',body.rank)}</h2><strong className="ffmi-number">{body.ffmi?.toFixed(1)??'—'} <small>FFMI</small></strong><p>Fat-free mass ÷ height² · kg/m²</p><p>{body.next?`Next form at ${body.next} FFMI`:'Maximum game tier'} · {profile.sex==='F'?'Women’s':'Open'} milestone track</p><button className="outlined-button" onClick={()=>reveal(body.rank,'body')}>VIEW TRANSFORMATION</button></div></section><p className="fine-print">Raw FFMI uses your current profile: {profile.bodyweight} kg, {profile.height} cm, {profile.bodyFat??'—'}% body fat. No height normalization. Body-fat measurement error affects the result. Custom game milestones ({body.thresholds.join(' / ')}), not health targets or a global ranking. Formula: <a href="https://pubmed.ncbi.nlm.nih.gov/7496846/" target="_blank" rel="noreferrer">Kouri et al.</a></p><RankGallery domain="body" rank={body.rank} reveal={reveal}/></>
}
export function UltimatePanel({profile,entries,reveal}:{profile:Profile;entries:LiftEntry[];reveal:(rank:number,domain:RankDomain,preview?:boolean)=>void}){
  const stats=ultimateStats(entries,profile)
  return <><section className="surface-panel ultimate-panel"><div className="panel-heading"><div><div className="eyebrow">GOKU · ULTIMATE RANK</div><h3>{stats.score.toFixed(1)} / 100 <span className="small-count">{stats.coverage}/7 INPUTS · {stats.coverage===7?'COMPLETE':'PROVISIONAL'}</span></h3></div><button className="outlined-button" onClick={()=>reveal(stats.rank,'ultimate')}>REVEAL GOKU</button></div><div className="ultimate-parts">{stats.parts.map(p=><div key={p.id}><span>{p.id==='body'?'FFMI':liftInfo[p.id as LiftId].short}</span><strong>{p.present?p.score.toFixed(0):'—'}</strong><div className="progress-track"><span style={{width:`${p.score}%`}}/></div></div>)}</div><p className="fine-print">Equal weight: six lifts + FFMI, each worth 1/7. Each score follows progress through six custom milestones, capped at 100. Missing inputs contribute zero. Ultimate levels unlock every 16⅔ points; level 7 requires all seven at 100. This is a game score, not a global percentile.</p></section><RankGallery domain="ultimate" rank={stats.rank} reveal={reveal}/></>
}
