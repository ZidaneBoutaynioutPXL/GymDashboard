import { useEffect, useRef, type CSSProperties } from 'react'
import { CharacterArt } from './CharacterArt'
import { signatures } from './characterExperience'
import type { RankDomain } from './ranks'

// Eight separate procedural scenes. No video, GIF, or animated raster sequence.
function EnergyCanvas({domain,duration,running}:{domain:RankDomain;duration:number;running:boolean}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const canvas=ref.current!,ctx=canvas.getContext('2d');if(!ctx)return
    const {color,accent,effect}=signatures[domain]
    let frame=0,width=1,height=1,disposed=false
    const resize=()=>{const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
    const observer=new ResizeObserver(()=>{resize();cancelAnimationFrame(frame);draw(performance.now())});observer.observe(canvas);resize()
    const start=performance.now()
    function draw(now:number){
      if(disposed)return
      const p=running?Math.min(1,(now-start)/duration):1,t=p*5,charge=Math.min(1,p/.44),burst=Math.max(0,(p-.44)/.56)
      ctx!.clearRect(0,0,width,height);ctx!.save();ctx!.translate(width/2,height*.48)
      const size=Math.min(width,height),r=size*.26
      ctx!.globalCompositeOperation='lighter'
      const line=(points:number[][],stroke=color,w=2,alpha=1)=>{ctx!.globalAlpha=alpha;ctx!.strokeStyle=stroke;ctx!.lineWidth=w;ctx!.beginPath();points.forEach(([x,y],i)=>i?ctx!.lineTo(x,y):ctx!.moveTo(x,y));ctx!.stroke()}
      const ring=(radius:number,stroke=color,w=2,alpha=.7,squash=1)=>{ctx!.globalAlpha=alpha;ctx!.strokeStyle=stroke;ctx!.lineWidth=w;ctx!.beginPath();ctx!.ellipse(0,0,Math.max(1,radius),Math.max(1,radius*squash),0,0,Math.PI*2);ctx!.stroke()}
      const glow=(x:number,y:number,radius:number,c=color,alpha=.5)=>{ctx!.globalAlpha=alpha;const g=ctx!.createRadialGradient(x,y,0,x,y,Math.max(1,radius));g.addColorStop(0,c);g.addColorStop(1,c+'00');ctx!.fillStyle=g;ctx!.fillRect(x-radius,y-radius,radius*2,radius*2)}
      // Ambient sparks move along each character's own field.
      for(let i=0;i<48;i++){const a=i*2.399+t*.15,dist=(.25+((i*17%47)/47))*(r+burst*size*.4);const x=Math.cos(a)*dist,y=Math.sin(a)*dist;glow(x,y,1.5+(i%3),i%3?color:accent,.3+charge*.4)}
      switch(effect){
        case 'destruction':{
          // A gravity well pulls orbiting fragments inward, then releases rings.
          glow(0,0,r*(.5+charge*.8),color,.48);ring(r*(1.3-charge*.55)+burst*size*.6,accent,3)
          for(let i=0;i<5;i++){ctx!.save();ctx!.rotate(t*(i%2?1:-1)+i*.6);ring(r*(.8+i*.12),color,1,.5,.24);ctx!.restore()}
          for(let i=0;i<14;i++){const a=i*.449+t,d=r*(1.7-charge*.8)+burst*size*.35;ctx!.save();ctx!.translate(Math.cos(a)*d,Math.sin(a)*d);ctx!.rotate(a);ctx!.globalAlpha=.8;ctx!.fillStyle=accent;ctx!.fillRect(-3,-7,6,14);ctx!.restore()}break
        }
        case 'eruption':{
          // Jagged pillars erupt from the floor, with ballistic rock fragments.
          glow(0,r*.7,r*1.5,color,.5)
          for(let i=0;i<11;i++){const x=(i-5)*size*.074,h=(.2+((i*7)%11)/14)*size*charge;line([[x-22,height*.5],[x-7,-h*.55],[x+2,-h],[x+15,-h*.2],[x+25,height*.5]],i%2?color:accent,3,.65)}
          for(let i=0;i<24;i++){const a=i*2.4,x=Math.cos(a)*r*(1+burst*2),y=r*.8-burst*size*(.4+i%5*.13)+burst*burst*size*.5;ctx!.save();ctx!.translate(x,y);ctx!.rotate(i+t);ctx!.globalAlpha=.8;ctx!.fillStyle=i%2?accent:color;ctx!.fillRect(-5,-8,10,16);ctx!.restore()}break
        }
        case 'sword':{
          // A gathered spirit blade cuts diagonally; two opposite trails split away.
          ctx!.save();ctx!.rotate(-.64);glow(0,0,r*.9,accent,.3)
          const length=size*(.25+charge*.9);line([[0,length/2],[0,-length/2]],color,18,.25);line([[0,length/2],[0,-length/2]],'#edfdff',3,.95)
          for(let i=0;i<7;i++){const x=(i-3)*9+burst*(i%2?1:-1)*size*.35;line([[x,-size*.7],[x+burst*size*.3,size*.7]],i%2?accent:color,2,.45)}ctx!.restore();break
        }
        case 'dragon':{
          // Orange growth aura and a spiralling drill beam wrap the fighter.
          glow(0,r*.4,r*(1+charge),color,.45)
          for(let i=0;i<6;i++){const rr=r*(.4+i*.2)+burst*r;ctx!.save();ctx!.rotate(i*.3+t*.35);ring(rr,i%2?accent:color,2,.7,.45);ctx!.restore()}
          const points=Array.from({length:90},(_,i)=>{const y=(i/89-.5)*size*1.3;return [Math.sin(i*.25-t*5)*(22+charge*35),y]});line(points,accent,4,.8)
          line([[0,-height*.55],[0,height*.6]],color,8,.3+burst*.4);break
        }
        case 'beast':{
          // Red branching lightning tears through a violet flame silhouette.
          glow(0,0,r*1.4,color,.4)
          for(let i=0;i<9;i++){const a=i*Math.PI*2/9+t*.15;const points=Array.from({length:8},(_,j)=>{const d=r*(.4+j*.22)*(charge+burst*.4),offset=Math.sin(j*9+i*4+t*2)*18;return [Math.cos(a)*d+offset,Math.sin(a)*d]});line(points,accent,2.5,.8)}
          for(let i=0;i<5;i++){const x=(i-2)*r*.45;line([[x-r*.2,r*1.1],[x,-r*(1.4+i%2*.4)*charge],[x+r*.2,r*1.1]],color,3,.6)}break
        }
        case 'eclipse':{
          // The eclipse gathers beside the hand, keeping the face visible.
          ctx!.save();ctx!.translate(-r*.95,r*.25)
          glow(0,-r*.25,r*1.4,accent,.45);ctx!.globalCompositeOperation='source-over';ctx!.globalAlpha=.95;ctx!.fillStyle='#080713';ctx!.beginPath();ctx!.arc(0,-r*.25,r*(.5+charge*.25),0,Math.PI*2);ctx!.fill();ctx!.globalCompositeOperation='lighter'
          ctx!.save();ctx!.translate(0,-r*.25);ring(r*.77,accent,3);for(let i=0;i<3;i++){ctx!.rotate(.7);ring(r*(1+i*.18),color,2,.7,.2)}ctx!.restore()
          for(let i=0;i<7;i++){const a=-Math.PI/2+i*.9+t*.12;line([[0,0],[Math.cos(a)*size*(.2+burst),Math.sin(a)*size*(.2+burst)]],i%2?color:accent,1.5,.65)}ctx!.restore();break
        }
        case 'bio':{
          // A cellular hexagon lattice feeds a focused green beam.
          for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){const x=col*r*.48+(row%2)*r*.24,y=row*r*.42;const rr=r*.24*(.5+charge*.5);line(Array.from({length:7},(_,i)=>[x+Math.cos(i*Math.PI/3)*rr,y+Math.sin(i*Math.PI/3)*rr]),color,1,.2+charge*.3)}
          glow(0,r*.15,r*(.4+charge*.5),accent,.5);if(burst){line([[-size,r*.15],[size,r*.15]],color,16*burst,.6);line([[-size,r*.15],[size,r*.15]],'#efffce',3,.9)}ring(r*(.2+burst*2),accent,2,.8);break
        }
        case 'instinct':{
          // Smooth silver flow lines orbit through space with calm blue echoes.
          glow(0,0,r*1.4,color,.23)
          for(let i=0;i<8;i++){ctx!.save();ctx!.rotate(i*.392+t*.22);ctx!.globalAlpha=.5;ctx!.strokeStyle=i%2?color:accent;ctx!.lineWidth=i%3?1:3;ctx!.beginPath();ctx!.ellipse(0,0,r*(1+i*.08),r*.34,0,t+i,t+i+Math.PI*1.4);ctx!.stroke();ctx!.restore()}
          for(let i=0;i<3;i++){const x=Math.sin(t*2+i*2.1)*r*(1-burst*.5);glow(x,Math.cos(t+i)*r*.4,r*.32,color,.25)}break
        }
      }
      ctx!.restore()
      canvas.dataset.progress=p.toFixed(3)
      if(running&&p<1)frame=requestAnimationFrame(draw)
    }
    draw(performance.now())
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect()}
  },[domain,duration,running])
  return <canvas ref={ref} className="character-energy-canvas" aria-hidden="true" data-effect={signatures[domain].effect}/>
}

export function CharacterStage({domain,rank,phase,duration,running,final=false}:{domain:RankDomain;rank:number;phase:string;duration:number;running:boolean;final?:boolean}){
  const s=signatures[domain]
  return <div className={`character-stage scene-${s.effect} ${running?'scene-running':'scene-still'}`} data-phase={phase} style={{'--scene-color':s.color,'--scene-accent':s.accent,'--scene-duration':`${duration}ms`} as CSSProperties}>
    <div className="scene-horizon"/><div className="scene-aura"/>
    {domain==='ultimate'&&<><CharacterArt domain={domain} rank={rank} className="scene-echo echo-left"/><CharacterArt domain={domain} rank={rank} className="scene-echo echo-right"/></>}
    {final&&<CharacterArt domain={domain} rank={5} className="scene-before"/>}
    <CharacterArt domain={domain} rank={rank} className={`scene-fighter ${final?'scene-final-fighter':''}`}/>
    <EnergyCanvas domain={domain} duration={duration} running={running}/>
    <div className="scene-impact"/><div className="scene-vignette"/>
    <div className="scene-corners" aria-hidden="true"><span>ASCEND</span><span>LIMIT BREAK // {s.effect.toUpperCase()}</span></div>
  </div>
}
