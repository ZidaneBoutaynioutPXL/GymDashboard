"""Create and retain a private signing identity for updates to this personal APK."""
from pathlib import Path
import os,secrets,subprocess

root=Path('.android-signing');root.mkdir(exist_ok=True)
keystore=root/'ascend-release.jks'
if keystore.exists():
    print('Existing release signing key retained.')
else:
    password=secrets.token_hex(24)
    env=dict(os.environ,ASCEND_SIGNING_PASSWORD=password)
    subprocess.run([r'C:\Users\12102706\.jdks\openjdk-22.0.1\bin\keytool.exe','-genkeypair','-keystore',str(keystore),
                    '-storepass:env','ASCEND_SIGNING_PASSWORD','-keypass:env','ASCEND_SIGNING_PASSWORD',
                    '-alias','ascend','-keyalg','RSA','-keysize','3072','-validity','10000',
                    '-dname','CN=Ascend Personal App, O=Ascend, C=BE'],env=env,check=True,capture_output=True)
    (root/'signing.properties').write_text(f'storePassword={password}\nkeyPassword={password}\n',encoding='utf8')
    print('Release signing identity created in ignored .android-signing directory.')
