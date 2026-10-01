import { characters, rankName, type RankDomain } from './ranks'
export function CharacterArt({domain,rank,className=''}:{domain:RankDomain;rank:number;className?:string}) {
  return <div role="img" aria-label={`${characters[domain].name} — ${rankName(domain,rank)}`} className={`character-art ${className}`} style={{backgroundImage:`url(/characters/${characters[domain].asset}.webp)`,backgroundPosition:`${rank%4/3*100}% ${Math.floor(rank/4)*100}%`}}/>
}
