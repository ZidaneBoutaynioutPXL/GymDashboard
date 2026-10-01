export async function onboard(page){
  await page.locator('.onboarding, .app-shell').first().waitFor()
  if(!await page.locator('.onboarding').isVisible())return
  await page.getByRole('button',{name:'BEGIN YOUR JOURNEY'}).click()
  await page.getByLabel('Athlete name').fill('Warrior')
  await page.getByRole('button',{name:'SET YOUR MISSION'}).click()
  await page.getByRole('button',{name:'ENTER YOUR TRAINING UNIVERSE'}).click()
  await page.getByRole('heading',{name:/Welcome back/}).waitFor()
}
export async function openLift(page,name){
  const back=page.getByRole('button',{name:'BACK TO YOUR CARDS'})
  if(await back.isVisible())await back.click()
  await page.getByRole('button',{name:`Open ${name}`,exact:true}).click()
  await page.locator('.opened-lift').waitFor()
}
