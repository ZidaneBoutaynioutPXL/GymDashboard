import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowRight, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { characters, rankName, type RankDomain } from './ranks'
import { CharacterArt } from './CharacterArt'
import { signatures } from './characterExperience'
import { stopRankSound } from './sound'
import clips from './revealClips.json'

type Playback = 'loading' | 'playing' | 'blocked' | 'failed' | 'finished'

export function FinalFormReveal({domain,preview,volume,onVolume,onDone}:{domain:RankDomain;preview:boolean;volume:number;onVolume:(v:number)=>void;onDone:()=>void}){
  const reduced=useReducedMotion()
  const [state,setState]=useState<Playback>(reduced?'finished':'loading')
  const [progress,setProgress]=useState(0),[replay,setReplay]=useState(0)
  const video=useRef<HTMLVideoElement>(null),attempt=useRef(0)
  const character=characters[domain],signature=signatures[domain]
  const clip=clips[character.asset as keyof typeof clips]
  const finished=state==='finished',running=state==='playing'||state==='loading'

  useEffect(()=>{const el=video.current;if(el){el.volume=volume;el.muted=volume===0}},[volume])
  useEffect(()=>{
    const el=video.current
    function paused(){if(el&&!el.ended&&el.currentTime>0&&el.currentTime<el.duration)setState(s=>s==='playing'?'blocked':s)}
    el?.addEventListener('pause',paused)
    return()=>el?.removeEventListener('pause',paused)
  },[])

  useEffect(()=>{
    const el=video.current
    if(!el)return
    const counter=attempt,token=++counter.current
    stopRankSound()
    if(!reduced)void el.play().catch(()=>{if(attempt.current===token)setState('blocked')})
    return()=>{counter.current++;el.pause();stopRankSound()}
  },[domain,reduced])

  useEffect(()=>{
    if(state!=='loading')return
    const timeout=setTimeout(()=>{attempt.current++;video.current?.pause();stopRankSound();setState('blocked')},10000)
    return()=>clearTimeout(timeout)
  },[state,replay])

  function play(){
    const el=video.current;if(!el)return
    const token=++attempt.current
    stopRankSound()
    setProgress(0);setState('loading');setReplay(r=>r+1)
    if(el.error)el.load()
    el.currentTime=0
    void el.play().catch(()=>{if(attempt.current===token)setState('blocked')})
  }
  function finish(){attempt.current++;video.current?.pause();stopRankSound();setProgress(1);setState('finished')}
  function playing(){
    setState('playing')
  }
  function fail(){attempt.current++;video.current?.pause();stopRankSound();setState('failed')}

  return <div className={`rank-reveal effect-cosmic final-form-reveal ultra-reveal ${finished?'ultra-finished':''}`} style={{'--scene-color':signature.color} as CSSProperties} data-domain={domain} data-rank="6" data-phase={finished?'finished':state}>
    <header className="final-form-header"><span>{preview?'FINAL FORM PREVIEW':'YOUR FINAL FORM'}</span><strong>{character.name.toUpperCase()} / 07</strong></header>
    <div className="ultra-screen">
      <video ref={video} src={clip.src} playsInline muted={volume===0} preload={reduced?'none':'auto'} aria-label={`${clip.form} character animation`} onPlaying={playing} onEnded={finish} onError={fail} onWaiting={()=>setState('loading')} onTimeUpdate={e=>{const el=e.currentTarget;if(el.duration)setProgress(el.currentTime/el.duration)}}/>
      {state==='loading'&&<div className="ultra-loading" role="status">PREPARING REVEAL<span/></div>}
      {(state==='blocked'||state==='failed')&&<div className="ultra-play-gate"><Play size={32}/><p>{state==='failed'?'Animation could not load. Retry or skip to your form.':'Your animation is ready. Tap play to begin.'}</p><button className="hero-button" onClick={play}>{state==='failed'?'RETRY ANIMATION':'PLAY ANIMATION'}</button></div>}
      {finished&&<div className="ultra-result" key={replay}><div className="ultra-rarity" aria-hidden="true">ULTRA</div><CharacterArt domain={domain} rank={6}/><div className="ultra-result-caption"><span>FINAL FORM</span><strong>{character.name}</strong></div></div>}
      {!finished&&<div className="ultra-clip-caption">{clip.form} <span>· {clip.kind}</span></div>}
    </div>
    <div className="final-timeline" role="progressbar" aria-label="Animation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><span style={{width:`${progress*100}%`}}/></div>
    <footer className="final-form-footer"><div className="eyebrow">{finished?signature.title:'AWAKEN YOUR POWER'}</div><h2>{rankName(domain,6).toUpperCase()}</h2><p>{character.name} · Final form</p>
      <div className="final-form-actions">{finished?<button className="hero-button" onClick={onDone}>KEEP ASCENDING <ArrowRight size={16}/></button>:<button className="outlined-button" onClick={finish}><SkipForward size={16}/> SKIP ANIMATION</button>}<button className="outlined-button" aria-label="Replay reveal" onClick={play}>{reduced&&!replay?<Play size={16}/>:<RotateCcw size={16}/>} {reduced&&!replay?'PLAY ANIMATION':'REPLAY'}</button></div>
      {reduced&&!running&&!replay&&<p className="final-motion-note">Reduced motion is on. Play the animation when you choose.</p>}
      <div className="sound-controls"><button aria-label={volume?'Mute rank sounds':'Enable rank sounds'} onClick={()=>onVolume(volume?0:.35)}>{volume?<Volume2 size={16}/>:<VolumeX size={16}/>}</button><label>CINEMATIC VOLUME<input aria-label="Rank sound volume" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>onVolume(Number(e.target.value))}/></label></div>
    </footer>
  </div>
}
