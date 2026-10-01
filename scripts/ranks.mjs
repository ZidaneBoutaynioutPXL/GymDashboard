import { onboard, openLift } from './onboard.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
await context.addInitScript(()=>{window.voices=0;const create=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){window.voices++;return create.call(this)}})
const page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'})
  await onboard(page)
  const calculations=await page.evaluate(async()=>{
    const {bodyStats,ultimateStats}=await import('/src/ranks.ts')
    const {estimatedMax}=await import('/src/strength.ts')
    const {globalComparison}=await import('/src/global.ts')
    const {defaultProfile,LIFT_IDS}=await import('/src/data.ts')
    const p={...defaultProfile,sex:'M',bodyweight:80,height:180,bodyFat:20}
    const entry={id:'x',liftId:'pullup',weight:20,reps:5,bodyweight:80,date:'2026-09-23',note:''}
    const full=LIFT_IDS.map(liftId=>({...entry,liftId,weight:1000,reps:1}))
    return {ffmi:bodyStats(p).ffmi,missing:bodyStats({...p,bodyFat:null}).ffmi,weighted:estimatedMax(entry),single:estimatedMax({...entry,reps:1}),empty:ultimateStats([],{...p,bodyFat:null}),one:ultimateStats([full[0]],{...p,bodyFat:null}),full:ultimateStats(full,{...p,bodyweight:110,bodyFat:10}),bench:globalComparison('bench',p,98),dip:globalComparison('dip',p,52),pullup:globalComparison('pullup',p,0),unknown:globalComparison('ohp',{...p,sex:'Mx'},50),out:globalComparison('ohp',{...p,bodyweight:200},50),low:globalComparison('bench',p,0),high:globalComparison('bench',p,500)}
  })
  assert.ok(Math.abs(calculations.ffmi-19.7530864)<1e-6)
  assert.equal(calculations.missing,null)
  assert.ok(Math.abs(calculations.weighted-36.6666667)<1e-6)
  assert.equal(calculations.single,20)
  assert.equal(calculations.empty.score,0);assert.equal(calculations.empty.coverage,0)
  assert.ok(Math.abs(calculations.one.score-100/7)<1e-6);assert.equal(calculations.one.rank,0)
  assert.equal(calculations.full.score,100);assert.equal(calculations.full.rank,6);assert.equal(calculations.full.coverage,7)
  assert.equal(calculations.bench.percentile,50);assert.equal(calculations.dip.percentile,50)
  assert.ok(calculations.pullup);assert.equal(calculations.unknown,null);assert.equal(calculations.out,null)
  assert.equal(calculations.low.label,'<5th');assert.equal(calculations.high.label,'>95th')
  const effects=new Set()
  async function gallery(domain){
    assert.equal(await page.locator('.evolution-card').count(),7)
    for(let rank=0;rank<7;rank++){
      await page.locator('.evolution-card').nth(rank).click()
      const reveal=page.locator('.rank-reveal')
      assert.equal(await reveal.getAttribute('data-domain'),domain)
      assert.equal(await reveal.getAttribute('data-rank'),String(rank))
      assert.match(await reveal.innerText(),/FORM PREVIEW/)
      effects.add((await reveal.getAttribute('class')).match(/effect-\w+/)[0])
      
      await page.getByRole('button',{name:'KEEP ASCENDING'}).click()
      await reveal.waitFor({state:'hidden'})
    }
  }
  await gallery('ultimate')
  await page.getByRole('button',{name:'My lifts',exact:true}).click()
  for(const [domain,name] of [['bench','Bench press'],['squat','Back squat'],['deadlift','Deadlift'],['ohp','Overhead press'],['dip','Weighted dip'],['pullup','Weighted pull-up']]){
    await openLift(page,name)
    await gallery(domain)
  }
  await page.screenshot({path:'tmp/ranks-lifts.png',fullPage:true})
  await page.getByRole('button',{name:'Body stats',exact:true}).click()
  await gallery('body')
  assert.equal(effects.size,7)
  await page.locator('.evolution-card').nth(6).click()
  await page.getByRole('button',{name:'Mute rank sounds'}).click()
  const before=await page.evaluate(()=>window.voices)
  await page.getByRole('button',{name:'Replay reveal'}).click()
  assert.equal(await page.evaluate(()=>window.voices),before,'Muted replay must create no audio voices')
  await page.getByRole('button',{name:'Enable rank sounds'}).click()
  await page.getByRole('button',{name:'Replay reveal'}).click()
  await page.waitForFunction(()=>{const v=document.querySelector('video');return v?.currentTime>.2&&!v.muted&&v.webkitAudioDecodedByteCount>0})
  await page.getByRole('button',{name:'KEEP ASCENDING'}).click()
  await page.getByRole('button',{name:'Overview',exact:true}).click()
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.locator('.evolution-card').nth(6).click()
  await page.waitForTimeout(1000)
  await page.screenshot({path:'tmp/goku-ultra-instinct.png'})
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:'tmp/mobile-goku.png'})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.getByRole('button',{name:'SKIP ANIMATION'}).click()
  await page.getByRole('button',{name:'KEEP ASCENDING'}).click()
  await page.reload({waitUntil:'networkidle'})
  assert.equal(await page.evaluate(()=>localStorage.getItem('ascend-volume')),'0.35')
  assert.equal(errors.length,0,errors.join('\n'))
  console.log('Rank tests passed: FFMI, weighted 1RM, ultimate missing/full inputs, global table anchors/tails/category bounds, 56 previews, seven effects, mute/replay/persistence, mobile.')
}finally{await browser.close()}
