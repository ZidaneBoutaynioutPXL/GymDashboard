"""Render energy bursts with actual Goku vocals. Source credits in MEDIA.md.
Requires numpy, imageio-ffmpeg and the locally retained Goku archive.
"""
import subprocess, wave, zipfile
from pathlib import Path
import numpy as np
import imageio_ffmpeg

SR=44100
FF=imageio_ffmpeg.get_ffmpeg_exe()
rng=np.random.default_rng(928)
archive=zipfile.ZipFile('tmp/goku-voice.zip')
def vocal(name):
    raw=subprocess.run([FF,'-v','error','-i','pipe:0','-f','f32le','-ac','1','-ar',str(SR),'-'],input=archive.read(name),capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype='<f4').copy()
short=vocal('Goku (MUI)/Battle/cha_vc_gokuui_477_019_vc_atk_s.ogg')
long=vocal('Goku (MUI)/Greencard/arts_vc_gokuui_ex_angershout_003_Cue_0.ogg')

def render(rank,card=False):
    duration=.85 if card else 2.3+rank*.08
    t=np.arange(int(duration*SR))/SR
    y=np.zeros((len(t),2))
    def add(signal,at=0,level=1,pan=0):
        start=int(at*SR);n=min(len(signal),len(y)-start)
        if n<=0:return
        y[start:start+n,0]+=signal[:n]*level*np.sqrt((1-pan)/2)
        y[start:start+n,1]+=signal[:n]*level*np.sqrt((1+pan)/2)
    # Fast charge, low impact and a descending, crackling energy trail.
    impact=.16
    noise=rng.normal(0,1,len(t))
    freq=np.fft.rfftfreq(len(t),1/SR)
    air=np.fft.irfft(np.fft.rfft(noise)*np.exp(-((freq-2300)/1700)**2),len(t))
    air/=max(abs(air))
    air*=np.minimum(t/impact,1)**2*np.exp(-np.maximum(t-impact,0)/.13)
    add(air,level=.38,pan=-.25)
    tt=np.arange(int(.55*SR))/SR
    kick=np.sin(2*np.pi*(52*tt+70*.035*(1-np.exp(-tt/.035))))*np.exp(-tt/.09)
    add(kick,impact,.3)
    trail=np.sin(2*np.pi*(180*tt+520*.045*(1-np.exp(-tt/.045))))*np.exp(-tt/.12)
    add(trail,impact,.1,pan=.4)
    voice=short if card or rank<2 else long
    add(voice,.2,.92)
    add(voice,.29,.15,pan=-.55)
    add(voice,.37,.07,pan=.55)
    # Higher ranks gain brief electric arcs, leaving the vocal clear.
    if not card:
        for i in range(rank):
            arc=rng.normal(0,1,int(.075*SR))*np.exp(-np.arange(int(.075*SR))/SR/.018)
            add(arc,.28+i*.21,.025,pan=(-1 if i%2 else 1)*.7)
    y*=np.minimum((duration-t)/.1,1)[:,None]
    y=np.tanh(y*1.25)
    y*=.88/max(.88,np.max(abs(y)))
    return y

Path('tmp').mkdir(exist_ok=True)
Path('public/audio').mkdir(parents=True,exist_ok=True)
for name,samples in [('card-open',render(0,True))]+[(f'rank-{r}',render(r)) for r in range(7)]:
    wav=Path('tmp')/(name+'.wav')
    with wave.open(str(wav),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((samples*32767).astype('<i2').tobytes())
    subprocess.run([FF,'-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','160k',f'public/audio/{name}.mp3'],check=True)
print('Rendered 8 stereo Dragon Ball energy/vocal cues; card cue 0.85s, ranks 2.3–2.78s.')
