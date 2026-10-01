import { onboard } from './onboard.mjs'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await onboard(page)
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json())
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.icons.length, 2)
  await context.setOffline(true)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor()
  assert.equal(await page.evaluate(async()=>{for(const name of ['goku','vegeta','broly','trunks','piccolo','gohan','frieza','cell']){const r=await fetch(`/characters/${name}.webp`);if(!r.ok||!(await r.blob()).size)return false}return true}),true)
  await page.locator('.evolution-card').last().click()
  await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.5)
  assert.equal(await page.locator('video').count(),1)
  assert.ok(await page.locator('video').evaluate(v=>v.webkitAudioDecodedByteCount>0),'Offline cinematic audio decoded')
  const decoded=await page.evaluate(async()=>{
    for(const name of ['goku','vegeta','broly','trunks','piccolo','gohan','frieza','cell']){
      await new Promise((resolve,reject)=>{
        const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto'
        const timer=setTimeout(()=>{v.remove();reject(new Error(`Offline decode timed out: ${name}`))},10000)
        v.onloadeddata=()=>{clearTimeout(timer);const valid=v.videoWidth>0&&v.duration>3;v.removeAttribute('src');v.load();v.remove();if(valid)resolve(true);else reject(new Error(name))}
        v.onerror=()=>{clearTimeout(timer);v.remove();reject(new Error(`Offline decode failed: ${name}`))}
        v.src=`/cinematics/finals/${name}.mp4`;document.body.append(v)
      })
    }return 8
  });assert.equal(decoded,8)
  const audio=await page.evaluate(async()=>{const ctx=new AudioContext();let count=0;for(const character of ['vegeta','broly','trunks','piccolo','gohan','frieza','cell','goku'])for(const cue of ['entry-0','entry-1','entry-2','rank-0','rank-1','rank-2','rank-3','rank-4','rank-5','final','log-0','log-1']){const r=await fetch(`/audio/characters/${character}/${cue}.mp3`);const b=await ctx.decodeAudioData(await r.arrayBuffer());if(b.numberOfChannels===2&&b.duration>1)count++}await ctx.close();return count})
  assert.equal(audio,96)
  const skip=page.getByRole('button',{name:'SKIP ANIMATION'});if(await skip.isVisible())await skip.click()
  await page.getByRole('button',{name:'KEEP ASCENDING'}).click()
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.getByRole('button', { name: 'Notebook', exact: true }).click()
  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Offline gym note')
  await page.getByLabel('Your note').fill('Saved without a connection.')
  await page.getByRole('button', { name: 'Save note', exact: true }).click()
  await page.getByText('Offline gym note').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.getByRole('button', { name: 'Notebook', exact: true }).click()
  await page.getByText('Offline gym note').waitFor()
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.getByRole('button', { name: 'Compare', exact: true }).click()
  await page.getByRole('heading', { name: 'Body-fat reference' }).waitFor()
  assert.equal(errors.length, 0, errors.join('\n'))
  console.log('Offline test passed: service worker, install manifest, eight character video decodes and all 96 audio decodes, cached pages, offline writes and persistence.')
} finally {
  await browser.close()
}
