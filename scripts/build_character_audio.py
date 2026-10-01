"""Build 96 credited character cues; never pitch-shift or clone performers."""
import json, subprocess, wave, zipfile, hashlib
from pathlib import Path
import numpy as np
import imageio_ffmpeg

SR=44100
FF=imageio_ffmpeg.get_ffmpeg_exe()
packs={'vegeta':446045,'broly':445968,'trunks':446039,'piccolo':446052,'gohan':445951,'frieza':443695,'cell':443693,'goku':445944}
manifest={}
for index,(character,asset) in enumerate(packs.items()):
    archive=zipfile.ZipFile('tmp/goku-voice.zip' if character=='goku' else f'tmp/character-voices/{character}.zip')
    clips=[]
    for name in archive.namelist():
        if not name.endswith('.ogg') or not any(k in name.lower() for k in ['normal entrance/','/ultimate/','atk_s','kidame','hensin','henshin','angershout','powerup']):continue
        raw=subprocess.run([FF,'-v','error','-i','pipe:0','-f','f32le','-ac','1','-ar',str(SR),'-'],input=archive.read(name),capture_output=True,check=True).stdout
        samples=np.frombuffer(raw,dtype='<f4').copy()
        # Trim silence only; retain the complete utterance without speeding it up.
        audible=np.where(abs(samples)>.008)[0]
        if not len(audible):continue
        samples=samples[max(0,audible[0]-441):min(len(samples),audible[-1]+882)]
        length=len(samples)/SR
        if .15<length<3.4:clips.append((name,samples,length))
    short=sorted([c for c in clips if c[2]<1.3],key=lambda c:('normal entrance/' not in c[0].lower(),'atk_s' not in c[0],c[0]))
    ranked=sorted([c for c in clips if .4<c[2]<2.2],key=lambda c:('kidame' not in c[0] and 'powerup' not in c[0],'/Ultimate/' not in c[0],c[0]))
    final=sorted([c for c in clips if 1<c[2]<3.2],key=lambda c:(not any(k in c[0] for k in ['kidame','hensin','henshin','angershout','powerup']),-c[2]))
    assert len(short)>=3 and ranked and final,character
    output=Path(f'public/audio/characters/{character}');output.mkdir(parents=True,exist_ok=True)
    manifest[character]={'source':f'https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/{asset}/','clips':{}}
    cues=[(f'entry-{i}',short[i],1.8) for i in range(3)]+[(f'rank-{i}',ranked[i%len(ranked)],2.9) for i in range(6)]+[('final',final[0],4.8)]+[(f'log-{i}',short[(i+3)%len(short)],1.8) for i in range(2)]
    for number,(cue,(source,voice,length),duration) in enumerate(cues):
        rng=np.random.default_rng(index*100+number)
        t=np.arange(int(duration*SR))/SR;y=np.zeros((len(t),2))
        def add(s,at=0,level=1,pan=0):
            a=int(at*SR);n=min(len(s),len(y)-a)
            if n<=0:return
            y[a:a+n,0]+=s[:n]*level*np.sqrt((1-pan)/2)
            y[a:a+n,1]+=s[:n]*level*np.sqrt((1+pan)/2)
        impact=2.1 if cue=='final' else .18
        # Each fighter has a different charge texture, pitch contour and rhythm.
        root=[62,38,220,85,130,310,105,185][index]
        band=[1000,450,3800,1700,2800,4300,1450,2500][index]
        noise=rng.normal(0,1,len(t));freq=np.fft.rfftfreq(len(t),1/SR)
        air=np.fft.irfft(np.fft.rfft(noise)*np.exp(-((freq-band)/(band*.65))**2),len(t))
        air/=max(abs(air))
        env=np.minimum(t/impact,1)**1.8*np.exp(-np.maximum(t-impact,0)/(.13+index*.012))
        add(air*env,level=.23,pan=-.35)
        tt=np.arange(int(.8*SR))/SR
        hit=np.sin(2*np.pi*(root*tt+(90+index*25)*.045*(1-np.exp(-tt/.045))))*np.exp(-tt/.15)
        add(hit,impact,.22,pan=.2)
        for i in range(1+index%3):
            crack=rng.normal(0,1,int(SR*.08))*np.exp(-np.arange(int(SR*.08))/SR/.012)
            add(crack,impact+i*.11,.04,pan=(-1 if i%2 else 1)*.7)
        voice=voice/max(.2,max(abs(voice)))*.72
        start=.65 if cue=='final' else .25
        add(voice,start,.9);add(voice,start+.12,.11,pan=.6)
        if cue=='final':
            tail=np.sin(2*np.pi*(root*1.5)*t)*np.exp(-np.maximum(t-impact,0)/.6)*np.minimum(t/impact,1)
            add(tail,level=.065,pan=-.4)
        y*=np.minimum((duration-t)/.12,1)[:,None]
        y=np.tanh(y*1.2);y*=.87/max(.87,np.max(abs(y)))
        wav=Path('tmp/character-cue.wav')
        with wave.open(str(wav),'wb') as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((y*32767).astype('<i2').tobytes())
        dest=output/f'{cue}.mp3'
        subprocess.run([FF,'-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k',str(dest)],check=True)
        manifest[character]['clips'][cue]={'vocal':source,'vocalSeconds':round(length,3),'seconds':duration,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
    print(character,len(cues),'cues',flush=True)
Path('src/characterAudio.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
print('96 character cues written with per-clip provenance.')
