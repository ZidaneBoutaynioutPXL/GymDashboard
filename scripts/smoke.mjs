import { onboard, openLift } from './onboard.mjs'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
mkdirSync('tmp', { recursive: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true, locale: 'en-US' })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
async function dismissReveals(){
  await page.getByRole('button',{name:'KEEP ASCENDING'}).waitFor()
  for(let i=0;i<3;i++){
    const button=page.getByRole('button',{name:'KEEP ASCENDING'})
    if(!await button.isVisible())break
    const previous=await button.elementHandle()
    await button.click()
    await previous.waitForElementState('hidden')
  }
}

try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await onboard(page)
  await page.getByRole('heading', { name: /Welcome back/ }).waitFor()
  await page.screenshot({ path: 'tmp/desktop-initial.png', fullPage: true })

  await page.getByRole('button', { name: 'Profile', exact: true }).click()
  await page.getByLabel('Name', { exact: true }).fill('Alex')
  await page.getByLabel('Age').fill('27')
  await page.getByLabel('Bodyweight (kg)').fill('80')
  await page.getByLabel('Competition category').selectOption('M')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await page.getByRole('heading', { name: /Welcome back, Alex/ }).waitFor()

  await page.locator('.page-heading').getByRole('button', { name: 'Log a lift' }).click()
  await page.getByLabel('Weight (kg)', { exact: true }).fill('80')
  await page.getByLabel('Reps').fill('5')
  await page.getByRole('button', { name: 'Save lift' }).click()
  await page.getByRole('heading', { name: 'SUPER SAIYAN GOD' }).waitFor()
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'tmp/transformation.png' })
  await dismissReveals()
  await page.getByText('93.3 kg').first().waitFor()

  await page.getByRole('button', { name: 'My lifts' }).click()
  await openLift(page,'Bench press')
  assert.match(await page.locator('.detail-value').first().innerText(), /93\.3 kg/)
  await page.getByRole('button', { name: 'VIEW TRANSFORMATION' }).click()
  await page.getByRole('heading', { name: 'SUPER SAIYAN GOD' }).waitFor()
  await dismissReveals()

  for (const [name, weight] of [['Back squat','140'], ['Deadlift','180']]) {
    await openLift(page,name)
    await page.getByRole('button', { name: 'LOG SET', exact: true }).click()
    await page.getByLabel('Weight (kg)', { exact: true }).fill(weight)
    await page.getByLabel('Reps', { exact: true }).fill('1')
    await page.getByRole('button', { name: 'Save lift' }).click()
    await dismissReveals()
  }
  await openLift(page,'Weighted pull-up')
  await page.getByRole('button', { name: 'LOG SET', exact: true }).click()
  await page.getByLabel('Added weight (kg)',{exact:true}).fill('20')
  await page.getByLabel('Reps', { exact: true }).fill('5')
  await page.getByRole('button', { name: 'Save lift' }).click()
  await page.locator('.modal-card').waitFor({state:'hidden'})
  assert.match(await page.locator('.rank-current').innerText(), /First form/)
  assert.match(await page.locator('.detail-value').first().innerText(), /36\.7 kg/)
  await page.getByRole('button', { name: 'LOG SET', exact: true }).click()
  await page.getByLabel('Added weight (kg)',{exact:true}).fill('10')
  await page.getByLabel('Reps', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Save lift' }).click()
  await page.locator('.modal-card').waitFor({ state: 'hidden' })
  assert.match(await page.locator('.detail-value').first().innerText(), /\+10 kg/)
  assert.match(await page.locator('.detail-value').nth(1).innerText(), /36\.7 kg/)

  await page.getByRole('button', { name: 'Notebook' }).click()
  await page.getByRole('button', { name: 'New note' }).click()
  await page.getByLabel('Title').fill('Protein plan')
  await page.getByLabel('Category').selectOption('Nutrition')
  await page.getByLabel('Your note').fill('Aim for a consistent daily protein target.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await page.getByText('Protein plan').waitFor()
  await page.locator('.filter-pills').getByRole('button', { name: 'Nutrition' }).click()
  assert.equal(await page.locator('.note-card').count(), 1)

  await page.getByRole('button', { name: 'Training plan' }).click()
  await page.getByRole('button', { name: 'EDIT DAY' }).click()
  await page.getByLabel('Day title').fill('Upper strength')
  await page.getByRole('button', { name: 'ADD EXERCISE' }).click()
  await page.getByRole('textbox', { name: 'Exercise', exact: true }).last().fill('Cable row')
  await page.getByRole('button', { name: 'Save day' }).click()
  await page.getByText('Cable row').waitFor()

  await page.getByRole('button', { name: 'Body stats' }).click()
  await page.getByRole('button', { name: 'Log check-in' }).click()
  await page.getByLabel('Body fat % (optional)').fill('18')
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await dismissReveals()
  await page.getByText('18%').first().waitFor()

  await page.getByRole('button', { name: 'Compare' }).click()
  await page.getByRole('heading', { name: 'Powerlifting comparison' }).waitFor()
  assert.match(await page.locator('.cohort-label').innerText(), /AGE 25-34/)
  assert.match(await page.locator('.peer-card').nth(1).innerText(), /PERCENTILE/)
  assert.match(await page.locator('.body-peer-panel').innerText(), /18%/)
  await page.screenshot({ path: 'tmp/desktop-compare.png', fullPage: true })

  await page.getByRole('button', { name: 'Settings & backup' }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const download = await downloadEvent
  const backupPath = await download.path()
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
  assert.equal(backup.profile.name, 'Alex')
  assert.equal(backup.entries.length, 5)
  assert.equal(backup.notes[0].title, 'Protein plan')
  await page.locator('input[type=file]').setInputFiles(backupPath)
  await page.getByText('Backup imported.', { exact: true }).waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Welcome back, Alex/ }).waitFor()
  await page.getByText('413.3 kg', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Compare', exact: true }).click()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'tmp/mobile-compare.png', fullPage: true })
  await page.getByRole('button', { name: 'Toggle menu' }).click()
  await page.getByRole('button', { name: 'Overview' }).click()
  await page.waitForTimeout(350)
  await page.screenshot({ path: 'tmp/mobile-overview.png', fullPage: true })
  assert.equal(errors.length, 0, errors.join('\n'))
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Mobile layout must not overflow horizontally')
  console.log('Smoke test passed: profile, logging, automatic rank reveal, notes, program, body stats, comparisons, backup round trip, reload persistence, mobile navigation.')
} finally {
  await browser.close()
}
