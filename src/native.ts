import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { stopRankSound } from './sound'

export const isNative = Capacitor.isNativePlatform()

export async function shareBackup(filename:string, contents:string) {
  const result=await Filesystem.writeFile({path:filename,data:contents,directory:Directory.Cache,encoding:Encoding.UTF8})
  await Share.share({title:'Ascend training backup',files:[result.uri],dialogTitle:'Save or share your backup'})
}

export function setupNative() {
  if(!isNative)return
  document.documentElement.classList.add('native-app')
  void App.addListener('backButton',()=>{
    const event=new Event('ascend-back',{cancelable:true})
    if(window.dispatchEvent(event))void App.minimizeApp()
  })
  void App.addListener('appStateChange',({isActive})=>{
    if(!isActive){stopRankSound();document.querySelectorAll('video,audio').forEach(el=>(el as HTMLMediaElement).pause())}
  })
}
