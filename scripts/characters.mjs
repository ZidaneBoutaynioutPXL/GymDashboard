import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {chromium} from 'playwright'
import {onboard} from './onboard.mjs'

const manifest=JSON.parse(readFileSync('src/characterAudio.json','utf8'))
assert.equal(Object.keys(manifest).length,8)
const hashes=new Set()
for(const [character,pack] of Object.entries(manifest)){
  assert.equal(Object.keys(pack.clips).length,12)
  for(const cue of Object.values(pack.clips)){assert.ok(cue.vocal.toLowerCase().includes(character==='trunks'?'trunks':character));hashes.add(cue.sha256)}
}
assert.equal(hashes.size,96,'Every cue has a distinct render and credited source vocal')
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const context=await browser.newContext({viewport:{width:1360,height:1000}})
await context.addInitScript(()=>{
  window.audioStarted=[];window.audioStops=0
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop
  AudioBufferSourceNode.prototype.start=function(...args){window.audioStarted.push({duration:this.buffer?.duration,channels:this.buffer?.numberOfChannels});return start.apply(this,args)}
  AudioBufferSourceNode.prototype.stop=function(...args){window.audioStops++;return stop.apply(this,args)}
})
const page=await context.newPage(),errors=[],effects=new Set(),shots=new Set()
page.on('pageerror',e=>errors.push(e.message))
try{
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});await onboard(page)
  const domains=[['ultimate','Goku'],['bench','Bench press'],['squat','Back squat'],['deadlift','Deadlift'],['ohp','Overhead press'],['dip','Weighted dip'],['pullup','Weighted pull-up'],['body','Cell']]
  for(const [domain,name] of domains){
    if(domain==='body')await page.getByRole('button',{name:'Body stats',exact:true}).click()
    else if(domain!=='ultimate'){
      if(domain==='bench')await page.getByRole('button',{name:'My lifts',exact:true}).click()
      if(await page.getByRole('button',{name:'BACK TO YOUR CARDS'}).isVisible())await page.getByRole('button',{name:'BACK TO YOUR CARDS'}).click()
      const before=await page.evaluate(()=>window.audioStarted.length)
      await page.getByRole('button',{name:`Open ${name}`,exact:true}).click()
      await page.locator('.lift-entrance').waitFor()
      assert.equal(await page.locator('.lift-entrance').getAttribute('data-domain'),domain)
      assert.equal(await page.locator('.opened-lift').count(),0)
      await page.waitForFunction(n=>window.audioStarted.length>n,before)
      await page.waitForFunction(()=>Number(document.querySelector('.lift-entrance canvas')?.dataset.progress)>.25)
      await page.screenshot({path:`tmp/entrance-${domain}.png`})
      await page.locator('.opened-lift').waitFor()
      assert.equal(await page.locator('.lift-entrance').count(),0)
    }
    const before=await page.evaluate(()=>window.audioStarted.length)
    await page.locator('.evolution-card').last().click()
    const reveal=page.locator('.final-form-reveal')
    await reveal.waitFor()
    assert.equal(await reveal.getAttribute('data-domain'),domain)
    assert.equal(await reveal.locator('video').count(),1)
    assert.equal(await reveal.locator('canvas').count(),0)
    await page.waitForFunction(()=>document.querySelector('.final-form-reveal video')?.currentTime>1)
    assert.equal(await page.evaluate(()=>window.audioStarted.length),before,'Finals use embedded scene audio, not separate character cues')
    assert.ok(await reveal.locator('video').evaluate(v=>v.webkitAudioDecodedByteCount>0),'Embedded soundtrack decoded')
    assert.equal(await reveal.locator('video').evaluate(v=>v.muted),false)
    assert.equal(await reveal.locator('video').evaluate(v=>v.volume),.35)
    effects.add(await reveal.locator('video').getAttribute('src'))
    shots.add(await reveal.locator('video').evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL()}))
    await page.screenshot({path:`tmp/final-${domain}.png`})
    await page.waitForFunction(()=>document.querySelector('.final-form-reveal')?.dataset.phase==='finished')
    assert.equal(await reveal.locator('.scene-running').count(),0)
    await page.getByRole('button',{name:'KEEP ASCENDING'}).click();await reveal.waitFor({state:'hidden'})
  }
  assert.equal(effects.size,8);assert.equal(shots.size,8)
  // Replay and mute actually stop active buffers; closing cancels the scene.
  await page.locator('.evolution-card').last().click()
  await page.getByRole('button',{name:'Mute rank sounds'}).click()
  const before=await page.evaluate(()=>window.audioStarted.length)
  await page.getByRole('button',{name:'Replay reveal'}).click();await page.waitForTimeout(250)
  assert.equal(await page.evaluate(()=>window.audioStarted.length),before)
  assert.equal(await page.locator('video').evaluate(v=>v.muted),true)
  await page.getByRole('button',{name:'SKIP ANIMATION'}).click()
  assert.equal(await page.locator('video').evaluate(v=>v.paused),true)
  await page.getByRole('button',{name:'Enable rank sounds'}).click()
  await page.getByRole('button',{name:'Replay reveal'}).click()
  await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2)
  assert.equal(await page.locator('video').evaluate(v=>v.muted),false)
  await page.locator('video').evaluate(v=>{window.lastRevealVideo=v})
  await page.getByRole('button',{name:'Close',exact:true}).click()
  await page.locator('.final-form-reveal').waitFor({state:'hidden'})
  assert.equal(await page.evaluate(()=>window.lastRevealVideo.paused),true)
  // Reduced motion defaults to a static final form; explicit replay opts in.
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.locator('.evolution-card').last().click()
  assert.equal(await page.locator('.scene-running').count(),0)
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150)
  assert.equal(await page.locator('.ultra-result').count(),1)
  assert.equal(await page.locator('video').evaluate(v=>v.paused),true)
  await page.getByRole('button',{name:'Replay reveal'}).click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.screenshot({path:'tmp/final-character-mobile.png'})
  await page.getByRole('button',{name:'SKIP ANIMATION'}).click()
  await page.getByRole('button',{name:'KEEP ASCENDING'}).click()
  await page.locator('.final-form-reveal').waitFor({state:'hidden'})
  // Every rotation is accessible; cancellation leaves the collection intact.
  await page.setViewportSize({width:1360,height:1000});await page.emulateMedia({reducedMotion:'no-preference'})
  await page.getByRole('button',{name:'My lifts',exact:true}).click()
  for(let i=0;i<3;i++){
    await page.getByRole('button',{name:'Open Bench press',exact:true}).click();await page.locator('.lift-entrance').waitFor()
    await page.keyboard.press('Escape');await page.locator('.lift-entrance').waitFor({state:'hidden'})
    assert.equal(await page.locator('.warrior-card').count(),6)
  }
  await page.waitForTimeout(1900);assert.equal(await page.locator('.opened-lift').count(),0)
  assert.deepEqual(errors,[])
  console.log('Character tests passed: 96 unique cues; six voiced entrances; eight decoded character clips and final cards; audio, mute/replay/close, resize, reduced motion, cancellation and mobile.')
}finally{await browser.close()}
