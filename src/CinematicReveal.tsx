import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Play, RotateCcw, SkipForward, Volume2, VolumeX, ArrowRight } from 'lucide-react'

export function CinematicReveal({preview,volume,onVolume,onDone}:{preview:boolean;volume:number;onVolume:(v:number)=>void;onDone:()=>void}){
  const video=useRef<HTMLVideoElement>(null),reduced=useReducedMotion()
  const [ended,setEnded]=useState(false),[blocked,setBlocked]=useState(!!reduced),[failed,setFailed]=useState(false),[progress,setProgress]=useState(0)
  useEffect(()=>{const el=video.current;if(!el)return;el.volume=volume;el.muted=volume===0},[volume])
  useEffect(()=>{
    const el=video.current;if(!el)return
    let disposed=false
    if(!reduced)void el.play().then(()=>{if(!disposed)setBlocked(false)}).catch(()=>{if(!disposed)setBlocked(true)})
    return()=>{disposed=true;el.pause()}
  },[reduced])
  function play(){const el=video.current;if(!el)return;el.currentTime=0;setEnded(false);setFailed(false);setProgress(0);void el.play().then(()=>setBlocked(false)).catch(()=>setBlocked(true))}
  function skip(){video.current?.pause();setEnded(true);setBlocked(false)}
  return <div className={`rank-reveal cinematic-reveal ${ended?'cinematic-ended':''}`} data-domain="ultimate" data-rank="6">
    <div className="cinematic-header"><span>{preview?'FINAL FORM PREVIEW':'ULTIMATE RANK UNLOCKED'}</span><strong>GOKU / 07</strong></div>
    <div className="cinematic-screen"><video ref={video} src="/cinematics/goku-ultra-instinct.mp4" playsInline preload="auto" aria-label="Goku Ultra Instinct transformation cinematic" onEnded={()=>setEnded(true)} onTimeUpdate={e=>{const el=e.currentTarget;setProgress(el.duration?el.currentTime/el.duration:0)}} onError={()=>{setFailed(true);setBlocked(true)}}/>
      {blocked&&!ended&&<div className="cinematic-play"><button className="hero-button" onClick={play}><Play size={18}/>{failed?'RETRY CINEMATIC':'PLAY TRANSFORMATION'}</button><p>{failed?'Video could not load. You can retry or skip.':reduced?'Reduced motion is on. Play the video when you choose.':'Tap to start the transformation with sound.'}</p></div>}
      {ended&&<div className="cinematic-finish"><span>LIMITS TRANSCENDED</span><h2>ULTRA INSTINCT</h2><p>Goku · Your ultimate form</p></div>}
    </div>
    <div className="cinematic-timeline"><span style={{width:`${ended?100:progress*100}%`}}/></div>
    <div className="cinematic-footer"><div><span className="eyebrow">THE FINAL ASCENT</span><h3>{ended?'The work became power.':'Let your limits fall away.'}</h3><p>Six lifts. One physique. Every part of your journey.</p></div><div className="cinematic-buttons">{ended?<button className="hero-button" onClick={onDone}>KEEP ASCENDING <ArrowRight size={16}/></button>:<button className="outlined-button" onClick={skip}><SkipForward size={16}/> SKIP VIDEO</button>}<button className="icon-button" aria-label="Replay reveal" onClick={play}><RotateCcw size={18}/></button></div><div className="sound-controls"><button aria-label={volume?'Mute rank sounds':'Enable rank sounds'} onClick={()=>onVolume(volume?0:.35)}>{volume?<Volume2 size={16}/>:<VolumeX size={16}/>}</button><label>CINEMATIC VOLUME<input aria-label="Rank sound volume" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>onVolume(Number(e.target.value))}/></label></div></div>
  </div>
}
