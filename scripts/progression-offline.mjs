import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import {readFileSync} from 'node:fs'
import {onboard,openLift} from './onboard.mjs'
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const context=await browser.newContext({viewport:{width:1280,height:960},reducedMotion:'reduce',acceptDownloads:true}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await onboard(page)
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Training saga',exact:true}).click()
  await page.getByLabel('Saga name').fill('Offline Arc');await page.getByRole('button',{name:'BEGIN SAGA'}).click()
  await page.locator('.mission-checklist').waitFor()
  for(const checkbox of await page.locator('.mission-checklist input').all())await checkbox.check()
  await page.getByRole('button',{name:'COMPLETE WORKOUT'}).click()
  await page.getByText('MISSION CLEARED · +100 XP',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Training room',exact:true}).click()
  await page.locator('.reward-card').filter({has:page.getByRole('heading',{name:'Saiyan Spark',exact:true})}).getByRole('button',{name:'COLLECT REWARD'}).click()
  await page.getByRole('button',{name:'EQUIP AURA',exact:true}).click();await page.locator('.training-room.aura-spark').waitFor()
  await page.getByRole('button',{name:'My lifts',exact:true}).click();await openLift(page,'Bench press')
  await page.getByLabel('Planned weight (kg)',{exact:true}).fill('50')
  await page.getByRole('button',{name:'SAVE NEXT SESSION'}).click();await page.getByRole('heading',{name:/Saved plan/}).waitFor()
  await page.reload({waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Training room',exact:true}).click();await page.locator('.training-room.aura-spark').waitFor()
  await page.getByRole('button',{name:'My lifts',exact:true}).click();await openLift(page,'Bench press')
  assert.equal(await page.getByLabel('Planned weight (kg)',{exact:true}).inputValue(),'50')
  await page.getByRole('button',{name:'Settings & backup',exact:true}).click()
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup'}).click();const file=await event,payload=JSON.parse(readFileSync(await file.path(),'utf8'))
  assert.equal(payload.game.sagas[0].completed.length,1);assert.equal(payload.game.equipment.aura,'spark');assert.equal(payload.game.plans.bench.weight,50)
  assert.deepEqual(errors,[])
  console.log('Offline progression passed: production cache, saga creation/completion, reward claim/equip, coach planning, reload persistence and backup export without a network.')
}finally{await browser.close()}
