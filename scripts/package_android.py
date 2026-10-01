"""Audit and copy the signed APK to the user-facing download directory."""
from pathlib import Path
import json,hashlib,shutil,zipfile,subprocess

apk=Path('android/app/build/outputs/apk/release/app-release.apk')
subprocess.run([str(Path('tmp/android-sdk/build-tools/36.0.0/apksigner.bat').resolve()),'verify','--verbose',str(apk.resolve())],check=True)
with zipfile.ZipFile(apk) as archive:
    for directory in ['characters','audio/characters','cinematics/finals']:
        files=list((Path('public')/directory).rglob('*'))
        for file in files:
            if not file.is_file():continue
            key='assets/public/'+file.relative_to('public').as_posix()
            assert archive.read(key)==file.read_bytes(),f'Missing or different bundled asset: {key}'
    config=json.loads(archive.read('assets/capacitor.config.json'))
    assert not config.get('server',{}).get('url'),'APK must work without a development server'
    assert 'registerSW.js' not in archive.read('assets/public/index.html').decode()
dest=Path('releases');dest.mkdir(exist_ok=True)
output=dest/'Ascend-1.0.0.apk';shutil.copyfile(apk,output)
digest=hashlib.sha256(output.read_bytes()).hexdigest()
(dest/'SHA256SUMS.txt').write_text(f'{digest}  {output.name}\n',encoding='utf8')
(dest/'index.html').write_text('''<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Install Ascend</title><style>body{font:17px system-ui;background:#080c14;color:#edf3ff;max-width:540px;margin:12vh auto;padding:24px}a{display:block;background:#ffb643;color:#111;padding:18px;border-radius:12px;text-align:center;text-decoration:none;font-weight:bold}p{line-height:1.6;color:#adbed7}</style><h1>ASCEND</h1><p>Your training dashboard. Lifts, notes, programs, ranks and character cinematics—available offline.</p><a href="Ascend-1.0.0.apk" download>Download Android APK · v1.0.0</a><p>Open the downloaded file on your phone. If Android asks, allow installation from this browser. Then open Ascend.</p><p>Already have data in the browser? Export a backup and import it using Settings &amp; backup in the app.</p></html>''',encoding='utf8')
print(json.dumps({'apk':str(output.resolve()),'bytes':output.stat().st_size,'sha256':digest,'media':'All character artwork, cues and final videos verified byte-for-byte'},indent=2))
