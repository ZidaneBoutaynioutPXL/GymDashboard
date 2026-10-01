import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const page=await browser.newPage()
try{
  // Same origin, before the application has opened Dexie.
  await page.goto('http://127.0.0.1:5173/favicon.svg')
  await page.evaluate(()=>new Promise((resolve,reject)=>{
    const req=indexedDB.open('ascend-training-v1',20)
    req.onupgradeneeded=()=>{
      const d=req.result
      for(const [name,key,indices] of [['profiles','id',[]],['entries','id',['liftId','date']],['notes','id',['category','updatedAt']],['days','id',['dayIndex']],['measurements','id',['date']],['settings','key',[]]]){const store=d.createObjectStore(name,{keyPath:key});for(const index of indices)store.createIndex(index,index)}
      req.transaction.objectStore('profiles').put({id:'me',configured:true,name:'Existing Athlete',age:30,bodyweight:80,height:180,bodyFat:null,sex:'M',goals:{bench:100,squat:140,deadlift:180,ohp:70,dip:50,pullup:35}})
      req.transaction.objectStore('entries').put({id:'old-set',liftId:'bench',weight:80,reps:5,date:'2026-09-01',bodyweight:80,note:'Preserve this'})
      req.transaction.objectStore('notes').put({id:'old-note',category:'Training',title:'Existing cues',content:'Stay tight',updatedAt:'2026-09-01'})
      req.transaction.objectStore('settings').put({key:'initialized',value:'true'})
    }
    req.onerror=()=>reject(req.error);req.onsuccess=()=>{req.result.close();resolve(true)}
  }))
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
  await page.getByRole('heading',{name:'Welcome back, Existing Athlete.'}).waitFor()
  const result=await page.evaluate(async()=>{const {db}=await import('/src/data.ts');return {version:db.verno,entry:await db.entries.get('old-set'),note:await db.notes.get('old-note'),game:await db.game.count()}})
  assert.equal(result.version,3);assert.equal(result.entry.note,'Preserve this');assert.equal(result.note.content,'Stay tight');assert.equal(result.game,0)
  await page.getByRole('button',{name:'Training saga',exact:true}).click()
  assert.equal(await page.getByRole('button',{name:'BEGIN SAGA'}).isDisabled(),true,'An empty existing program must not start a saga')
  console.log('Migration passed: schema v2 to v3 preserves profile, lifts, notes and empty program; no re-onboarding or phantom rewards.')
}finally{await browser.close()}
