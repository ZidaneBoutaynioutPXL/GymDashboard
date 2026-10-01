"""Render original cinematic rank stingers and mux the local Goku cinematic.
Requires numpy, imageio-ffmpeg. Vocal sample provenance is in MEDIA.md.
"""
import numpy as np, wave,subprocess
from pathlib import Path
import imageio_ffmpeg
SR=44100
FF=imageio_ffmpeg.get_ffmpeg_exe()
OUT=Path('public/audio');OUT.mkdir(exist_ok=True)
Path('public/cinematics').mkdir(exist_ok=True)
rng=np.random.default_rng(72)
def sound(duration,level,cinematic=False):
    n=int(SR*duration);t=np.arange(n)/SR;y=np.zeros(n)
    def add(signal,start,gain=1):
        i=int(start*SR);count=min(len(signal),n-i)
        if count>0:y[i:i+count]+=signal[:count]*gain
    def hit(at,power=1):
        tt=np.arange(int(SR*1.5))/SR
        # Descending sub kick, gritty mid layer, and a short broadband crack.
        phase=2*np.pi*(36*tt+70*.075*(1-np.exp(-tt/.075)))
        sub=np.sin(phase)*np.exp(-tt/0.4)
        mid=np.tanh(2.2*np.sin(2*np.pi*74*tt))*np.exp(-tt/.16)
        crack=rng.normal(0,1,len(tt))*np.exp(-tt/.027)
        add(sub*.75+mid*.18+crack*.15,at,power)
    impact=2.15 if cinematic else .45+level*.13
    # Air accelerating into the impact, filtered in the frequency domain.
    noise=rng.normal(0,1,n);spectrum=np.fft.rfft(noise);freq=np.fft.rfftfreq(n,1/SR)
    spectrum*=np.exp(-((freq-1100)/1600)**2)
    air=np.fft.irfft(spectrum,n);air/=max(abs(air))
    rise=np.clip(t/impact,0,1)**2*np.exp(-np.maximum(t-impact,0)/.28)
    y+=air*rise*.55
    # Slow, dark detuned brass-like layer; no ascending notification melody.
    env=np.clip(t/.12,0,1)*np.exp(-np.maximum(t-impact,0)/(1.0+level*.15))
    root=49 if cinematic else 55-level*.7
    brass=sum(np.sin(2*np.pi*f*t+np.sin(t*3)*.05) for f in [root,root*1.003,root*1.5,root*2.001])
    y+=np.tanh(brass)*env*(.14+level*.025)
    hit(impact,.8+level*.055)
    if level>2:hit(impact+.24,.25)
    if cinematic:
        hit(7.7,.55)
        raw=subprocess.run([FF,'-v','error','-i','tmp/voices/5.ogg','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
        scream=np.frombuffer(raw,dtype='<f4').copy()
        add(scream,.3,.85)
        # Short room tail behind the actual character vocal.
        for delay,gain in [(0.12,.2),(.24,.1),(.4,.05)]:add(scream,.3+delay,gain)
    y*=np.clip((duration-t)/.6,0,1)
    y=np.tanh(y*1.15)
    y*=.87/max(np.max(np.abs(y)),1)
    return y
def write(path,samples):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((samples*32767).astype('<i2').tobytes())
for rank in range(7):
    wav=Path(f'tmp/rank-{rank}.wav');write(wav,sound(2.3+rank*.2,rank))
    subprocess.run([FF,'-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','160k',str(OUT/f'rank-{rank}.mp3')],check=True)
write('tmp/cinematic.wav',sound(10.44,6,True))
subprocess.run([FF,'-v','error','-y','-i','tmp/goku-awaken.mp4','-i','tmp/cinematic.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest','public/cinematics/goku-ultra-instinct.mp4'],check=True)
print('Rendered seven cinematic stingers and 10.44-second voiced transformation video.')
