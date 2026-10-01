import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {chromium} from 'playwright'
const adb='tmp/android-sdk/platform-tools/adb.exe'
const shell=(...args)=>execFileSync(adb,['-s','emulator-5554','shell',...args],{encoding:'utf8',windowsHide:true}).trim()
execFileSync(adb,['-s','emulator-5554','forward','tcp:9223',`localabstract:webview_devtools_remote_${shell('pidof','com.ascend.training')}`])
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223',{noDefaults:true})
const page=browser.contexts()[0].pages()[0]
page.setDefaultTimeout(30000)
try{
  await page.getByRole('heading',{name:/Welcome back, Android Warrior/}).waitFor()
  await page.evaluate(()=>{
    window.nativeAudioStarts=0
    const start=AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start=function(...args){window.nativeAudioStarts++;return start.apply(this,args)}
  })
  await page.getByRole('button',{name:'Toggle menu'}).click()
  await page.getByRole('button',{name:'My lifts',exact:true}).click()
  await page.getByRole('button',{name:'Open Bench press',exact:true}).click({force:true})
  await page.locator('.opened-lift').waitFor()
  assert.ok(await page.evaluate(()=>window.nativeAudioStarts)>0,'Character voice uses WebAudio')
  await page.locator('.evolution-card').last().click()
  await page.waitForFunction(()=>document.querySelector('video')?.currentTime>1)
  const media=await page.locator('video').evaluate(v=>{
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64
    const ctx=canvas.getContext('2d');ctx.drawImage(v,0,0,64,64)
    const pixels=ctx.getImageData(0,0,64,64).data
    return {frames:v.webkitDecodedFrameCount,audio:v.webkitAudioDecodedByteCount,nonblack:[...pixels].filter((x,i)=>i%4!==3&&x>30).length}
  })
  assert.ok(media.frames>0&&media.audio>0&&media.nonblack>100,JSON.stringify(media))
  shell('input','keyevent','3')
  await page.waitForTimeout(500)
  assert.equal(await page.locator('video').evaluate(v=>v.paused),true,'Backgrounding pauses video')
  shell('am','start','-n','com.ascend.training/.MainActivity')
  await page.getByRole('button',{name:'PLAY ANIMATION',exact:true}).click()
  await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>.5})
  shell('screencap','-p','/sdcard/ascend-video.png')
  execFileSync(adb,['-s','emulator-5554','pull','/sdcard/ascend-video.png','tmp/android-test/native-video.png'])
  shell('input','keyevent','4')
  await page.locator('.final-form-reveal').waitFor({state:'hidden'})
  console.log('Native lifecycle passed: data survived APK update; character voice; non-black decoded video frames and soundtrack; background pause; foreground replay; Android back.',media)
}finally{await browser.close()}
