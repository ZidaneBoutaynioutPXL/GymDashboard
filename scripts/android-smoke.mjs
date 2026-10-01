import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import {chromium} from 'playwright'
import {onboard} from './onboard.mjs'

const adb='tmp/android-sdk/platform-tools/adb.exe'
const serial=process.env.ANDROID_SERIAL||'emulator-5554'
const shell=(...args)=>execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',windowsHide:true}).trim()
mkdirSync('tmp/android-test',{recursive:true})
async function connect(){
  const pid=shell('pidof','com.ascend.training')
  assert.ok(pid,'Ascend must be running')
  execFileSync(adb,['-s',serial,'forward','tcp:9223',`localabstract:webview_devtools_remote_${pid}`],{windowsHide:true})
  return chromium.connectOverCDP('http://127.0.0.1:9223',{noDefaults:true})
}
const browser=await connect(),context=browser.contexts()[0],page=context.pages()[0],errors=[]
page.on('pageerror',e=>errors.push(e.message))
page.setDefaultTimeout(20000)
async function nav(name){
  if(await page.getByRole('button',{name:'Toggle menu'}).isVisible())await page.getByRole('button',{name:'Toggle menu'}).click()
  await page.getByRole('button',{name,exact:true}).click()
}
async function dismiss(){
  for(let i=0;i<4;i++){
    if(await page.getByRole('button',{name:'SKIP ANIMATION'}).isVisible())await page.getByRole('button',{name:'SKIP ANIMATION'}).click()
    const next=page.getByRole('button',{name:'KEEP ASCENDING'})
    if(!await next.isVisible())break
    try{await next.click({timeout:3000})}catch(error){if(await next.isVisible())throw error;break}
    await page.waitForTimeout(700)
  }
}
try{
  await page.waitForLoadState('domcontentloaded')
  assert.equal(await page.evaluate(()=>window.Capacitor.getPlatform()),'android')
  shell('svc','wifi','disable');shell('svc','data','disable')
  if(!process.env.ANDROID_RESUME_DATA){
  await page.reload();await onboard(page)
  await page.getByRole('button',{name:'Profile',exact:true}).click()
  await page.getByLabel('Name',{exact:true}).fill('Android Warrior')
  await page.getByLabel('Competition category').selectOption('M')
  await page.getByLabel('Bodyweight (kg)').fill('80')
  await page.getByRole('button',{name:'Save profile'}).click()
  await dismiss()
  await page.evaluate(()=>{
    window.nativeAudioStarts=0
    const start=AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start=function(...args){window.nativeAudioStarts++;return start.apply(this,args)}
  })
  const domains=[['Bench press','bench'],['Back squat','squat'],['Deadlift','deadlift'],['Overhead press','ohp'],['Weighted dip','dip'],['Weighted pull-up','pullup']]
  for(const [name,id] of domains){
    await nav('My lifts')
    const back=page.getByRole('button',{name:'BACK TO YOUR CARDS'})
    if(await back.isVisible())await back.click()
    console.log(`Testing ${id} on Android`)
    await page.getByRole('button',{name:`Open ${name}`,exact:true}).click({force:true})
    await page.locator('.opened-lift').waitFor()
    await page.getByRole('button',{name:'LOG SET',exact:true}).click()
    await page.getByLabel(id==='dip'||id==='pullup'?'Added weight (kg)':'Weight (kg)',{exact:true}).fill('20')
    await page.getByLabel('Reps',{exact:true}).fill('5')
    await page.getByRole('button',{name:'Save lift'}).click()
    await page.waitForTimeout(500);await dismiss()
    await page.locator('.evolution-card').last().click()
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.5)
    assert.ok(await page.locator('video').evaluate(v=>v.videoWidth>0&&v.webkitAudioDecodedByteCount>0&&!v.muted),`${id} video and audio`)
    await page.getByRole('button',{name:'Mute rank sounds'}).click()
    assert.equal(await page.locator('video').evaluate(v=>v.muted),true)
    await page.getByRole('button',{name:'Enable rank sounds'}).click()
    await page.screenshot({path:`tmp/android-test/${id}.png`})
    shell('input','keyevent','4')
    await page.locator('.final-form-reveal').waitFor({state:'hidden'})
  }
  for(const section of ['Overview','Body stats']){
    await nav(section);await page.locator('.evolution-card').last().click()
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.5)
    assert.ok(await page.locator('video').evaluate(v=>v.webkitAudioDecodedByteCount>0))
    await dismiss()
  }
  assert.ok(await page.evaluate(()=>window.nativeAudioStarts)>6,'WebAudio cues play on Android')
  }
  console.log('Testing Android data, progression and backups')
  await nav('Notebook');await page.getByRole('button',{name:'New note',exact:true}).click()
  await page.getByLabel('Title',{exact:true}).fill('Android offline note')
  await page.getByLabel('Your note').fill('Saved in the installed APK without internet.')
  await page.getByRole('button',{name:'Save note'}).click()
  await page.getByText('Android offline note').waitFor()
  await nav('Training plan');await page.getByRole('button',{name:'EDIT DAY'}).click()
  await page.getByLabel('Day title').fill('Android strength day')
  await page.getByRole('button',{name:'Save day'}).click()
  await nav('Body stats');await page.getByRole('button',{name:'Log check-in'}).click()
  await page.getByLabel('Body fat % (optional)').fill('18')
  await page.getByRole('button',{name:'Save check-in'}).click();await page.waitForTimeout(500);await dismiss()
  await nav('Compare');await page.getByRole('heading',{name:'Powerlifting comparison'}).waitFor()
  await nav('Training saga')
  await page.getByLabel('Saga name').fill('Android Arc')
  await page.getByRole('button',{name:'BEGIN SAGA'}).click()
  for(const box of await page.locator('.mission-checklist input').all())await box.check()
  await page.getByRole('button',{name:'COMPLETE WORKOUT'}).click()
  await page.getByText('MISSION CLEARED · +100 XP',{exact:true}).waitFor()
  await page.screenshot({path:'tmp/android-test/saga.png'})
  await nav('Training room')
  await page.locator('.reward-card').filter({has:page.getByRole('heading',{name:'Saiyan Spark',exact:true})}).getByRole('button',{name:'COLLECT REWARD'}).click()
  await page.getByRole('button',{name:'EQUIP AURA',exact:true}).click()
  await page.locator('.training-room.aura-spark').waitFor()
  await page.screenshot({path:'tmp/android-test/room.png'})
  await nav('Settings & backup')
  await page.getByRole('button',{name:'Export backup'}).click()
  await page.waitForTimeout(1000)
  const intent=shell('dumpsys','activity','activities')
  assert.match(intent,/ChooserActivity|ResolverActivity/,'Android native share sheet opens')
  shell('input','keyevent','4')
  const filename=`ascend-backup-${new Date().toISOString().slice(0,10)}.json`
  const backup=await page.evaluate(async name=>JSON.parse((await window.Capacitor.Plugins.Filesystem.readFile({path:name,directory:'CACHE',encoding:'utf8'})).data),filename)
  assert.equal(backup.profile.name,'Android Warrior');assert.equal(backup.entries.length,6)
  assert.equal(backup.notes[0].title,'Android offline note');assert.equal(backup.measurements.length,1)
  assert.equal(backup.game.sagas[0].completed.length,1);assert.equal(backup.game.equipment.aura,'spark')
  writeFileSync('tmp/android-test/backup.json',JSON.stringify(backup,null,2))
  await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))})
  await page.getByText('Backup imported.',{exact:true}).waitFor()
  await page.reload();await page.getByRole('heading',{name:/Welcome back, Android Warrior/}).waitFor()
  await page.screenshot({path:'tmp/android-test/overview.png'})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  assert.deepEqual(errors,[])
  console.log('Installed Android APK passed: offline boot, six lift logs, eight videos with decoded audio, WebAudio cues, Android back, notes, plan, measurements, comparisons, saga/room screens, native backup sharing, import and reload persistence.')
}finally{await browser.close()}

