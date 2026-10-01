import type { RankDomain } from './ranks'

export const signatures:Record<RankDomain,{color:string;accent:string;title:string;entrance:string;effect:string}>={
  bench:{color:'#bd69ff',accent:'#ff68bb',title:'DESTRUCTION AWAKENS',entrance:'THE PRINCE HAS ARRIVED',effect:'destruction'},
  squat:{color:'#a8ff48',accent:'#ffe977',title:'UNBOUND FURY',entrance:'UNLEASH YOUR STRENGTH',effect:'eruption'},
  deadlift:{color:'#6de8ff',accent:'#fff1a3',title:'CUT THROUGH YOUR LIMITS',entrance:'A FUTURE WORTH FIGHTING FOR',effect:'sword'},
  ohp:{color:'#ff9b37',accent:'#b3ff72',title:'THE NAMEKIAN AWAKENS',entrance:'FOCUS. THEN STRIKE.',effect:'dragon'},
  dip:{color:'#de9dff',accent:'#ff365f',title:'THE BEAST WITHIN',entrance:'YOUR POTENTIAL HAS NO LIMIT',effect:'beast'},
  pullup:{color:'#b76bff',accent:'#ffd36c',title:'AN EMPEROR REBORN',entrance:'POWER ABOVE ALL',effect:'eclipse'},
  body:{color:'#84ff9d',accent:'#ffe673',title:'PERFECTION, UNLEASHED',entrance:'EVERY DETAIL BECOMES POWER',effect:'bio'},
  ultimate:{color:'#d6f3ff',accent:'#799cff',title:'MOVE BEYOND THOUGHT',entrance:'LET YOUR LIMITS FALL AWAY',effect:'instinct'},
}
export const FINAL_DURATION=4800
export const ENTRANCE_DURATION=1800
