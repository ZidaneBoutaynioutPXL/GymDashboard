import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Volume2, VolumeX, X } from 'lucide-react'
import { CharacterStage } from './CharacterStage'
import { ENTRANCE_DURATION, signatures } from './characterExperience'
import { characters } from './ranks'
import type { LiftId } from './data'
import { liftInfo } from './strength'
import { playCardSound, setSoundVolume, soundVolume, stopRankSound } from './sound'

export function LiftEntrance({id,rank,onEnter,onCancel}:{id:LiftId;rank:number;onEnter:()=>void;onCancel:()=>void}){
  const [phase,setPhase]=useState('charge'),[volume,setVolume]=useState(soundVolume),panel=useRef<HTMLDivElement>(null)
  const enter=useRef(onEnter),cancel=useRef(onCancel)
  useEffect(()=>{enter.current=onEnter;cancel.current=onCancel})
  useEffect(()=>{
    const before=document.activeElement as HTMLElement|null,oldOverflow=document.body.style.overflow
    document.body.style.overflow='hidden';panel.current?.querySelector<HTMLButtonElement>('button')?.focus()
    playCardSound(id)
    const hit=setTimeout(()=>setPhase('impact'),650),end=setTimeout(()=>enter.current(),ENTRANCE_DURATION)
    function keydown(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();cancel.current()}if(e.key==='Tab'){const buttons=Array.from(panel.current?.querySelectorAll('button')??[]);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
    document.addEventListener('keydown',keydown)
    return()=>{clearTimeout(hit);clearTimeout(end);stopRankSound();document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',keydown);if(document.contains(before))before?.focus()}
  },[id])
  return createPortal(<div className={`lift-entrance entrance-${signatures[id].effect}`} role="dialog" aria-modal="true" aria-label={`${characters[id].name} lift entrance`} data-domain={id} ref={panel}>
    <div className="entrance-controls"><button className="outlined-button" aria-label="Cancel lift opening" onClick={onCancel}><X size={16}/> BACK</button><button className="outlined-button" aria-label={volume?'Mute entrance sounds':'Enable entrance sounds'} onClick={()=>{const v=volume?0:.35;setVolume(v);setSoundVolume(v)}}>{volume?<Volume2 size={16}/>:<VolumeX size={16}/>}</button></div>
    <div className="entrance-stage"><CharacterStage domain={id} rank={rank} duration={ENTRANCE_DURATION} phase={phase} running/><div className="entrance-name" aria-hidden="true">{characters[id].name}</div></div>
    <div className="entrance-copy"><div className="eyebrow">{signatures[id].entrance}</div><h2>{liftInfo[id].name}</h2><button className="hero-button" onClick={onEnter}>ENTER YOUR LIFT <ArrowRight size={16}/></button></div>
    <div className="entrance-progress"><span/></div>
  </div>,document.body)
}
