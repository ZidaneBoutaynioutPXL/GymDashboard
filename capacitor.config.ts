import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ascend.training',
  appName: 'Ascend',
  webDir: 'dist',
  backgroundColor: '#080c14',
  android: { backgroundColor: '#080c14', allowMixedContent: false },
  plugins: { SystemBars: { insetsHandling: 'native', style: 'DARK' } },
}
export default config
