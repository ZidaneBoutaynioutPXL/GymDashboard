import { characters, type RankDomain } from './ranks'
let context:AudioContext|undefined
let active:AudioBufferSourceNode|undefined
let gain:GainNode|undefined
let generation=0
const buffers=new Map<string,Promise<AudioBuffer>>()
export function soundVolume(){const raw=localStorage.getItem('ascend-volume');return raw===null?.35:Math.max(0,Math.min(1,Number(raw)||0))}
export function setSoundVolume(value:number){localStorage.setItem('ascend-volume',String(value));if(gain&&context)gain.gain.setTargetAtTime(value,context.currentTime,.025)}
export function unlockAudio(){context??=new AudioContext();if(context.state==='suspended')void context.resume()}
export function stopRankSound(){generation++;if(active){try{active.stop()}catch{/* finished */}active.disconnect();active=undefined}gain?.disconnect();gain=undefined}
const variations=new Map<string,number>()
const downloads=new Map<string,Promise<ArrayBuffer>>()
function next(domain:RankDomain,kind:string,count:number){const key=domain+kind,value=variations.get(key)??0;variations.set(key,value+1);return value%count}
function filename(domain:RankDomain,cue:string){return `characters/${characters[domain].asset}/${cue}`}
function download(name:string){if(!downloads.has(name))downloads.set(name,fetch(`/audio/${name}.mp3`).then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer()}).catch(e=>{downloads.delete(name);throw e}));return downloads.get(name)!}
export function preloadCharacterSound(domain:RankDomain){for(const cue of ['entry-0','entry-1','entry-2','final'])void download(filename(domain,cue)).catch(()=>{})}
export function playCharacterSound(domain:RankDomain,cue:string){playClip(filename(domain,cue))}
export function playRankSound(rank:number,domain:RankDomain='ultimate'){playCharacterSound(domain,rank===6?'final':`rank-${rank}`)}
export function playCardSound(domain:RankDomain='ultimate'){playCharacterSound(domain,`entry-${next(domain,'entry',3)}`)}
export function playLogSound(domain:RankDomain){playCharacterSound(domain,`log-${next(domain,'log',2)}`)}
function playClip(name:string){
  stopRankSound();if(!soundVolume())return
  unlockAudio();const ctx=context!,token=generation
  if(!buffers.has(name))buffers.set(name,download(name).then(b=>ctx.decodeAudioData(b.slice(0))))
  void buffers.get(name)!.then(buffer=>{
    if(token!==generation||!soundVolume())return
    active=ctx.createBufferSource();gain=ctx.createGain();active.buffer=buffer;gain.gain.value=soundVolume();active.connect(gain);gain.connect(ctx.destination);active.start()
  }).catch(()=>{buffers.delete(name)})
}
