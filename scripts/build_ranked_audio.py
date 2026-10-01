"""Original ranked-game audio: resonant metal, a warm chord, and stereo shimmer.
No League of Legends audio is copied. Requires numpy and imageio-ffmpeg.
"""
import numpy as np, subprocess, wave
from pathlib import Path
import imageio_ffmpeg
SR=44100
rng=np.random.default_rng(421)
ff=imageio_ffmpeg.get_ffmpeg_exe()
def render(rank,card=False):
    duration=.85 if card else 2.4+rank*.17
    t=np.arange(int(duration*SR))/SR;y=np.zeros((len(t),2))
    def add(signal,at=0,pan=0,gain=1):
        start=int(at*SR);n=min(len(signal),len(y)-start)
        if n<=0:return
        y[start:start+n,0]+=signal[:n]*gain*np.sqrt((1-pan)/2)
        y[start:start+n,1]+=signal[:n]*gain*np.sqrt((1+pan)/2)
    def bell(freq,length,level=1):
        tt=np.arange(int(length*SR))/SR
        return sum(a*np.sin(2*np.pi*freq*r*tt)*np.exp(-tt/(length*d)) for r,a,d in [(1,.6,.45),(2.76,.18,.2),(5.4,.07,.08)])*np.minimum(tt/.003,1)*level
    impact=.31 if card else .25+rank*.04
    noise=rng.normal(0,1,len(t));freq=np.fft.rfftfreq(len(t),1/SR)
    air=np.fft.irfft(np.fft.rfft(noise)*np.exp(-((freq-2200)/1900)**2),len(t))
    air/=max(abs(air));air*=np.clip(t/impact,0,1)**1.8*np.exp(-np.maximum(0,t-impact)/.09)
    add(air,gain=.13)
    add(bell(880+rank*40,.65),impact,pan=-.15,gain=.28 if card else .22)
    if not card:
        # A resolved, sustained chord rather than a sequence of notification notes.
        root=146.832*2**(rank/24)
        tt=np.arange(int((duration-impact)*SR))/SR
        env=(1-np.exp(-tt/.07))*np.exp(-tt/(.58+rank*.07))
        for i,ratio in enumerate([1,1.5,2,2.5]):
            f=root*ratio
            tone=(np.sin(2*np.pi*f*tt)+.18*np.sin(2*np.pi*f*2*tt)+.06*np.sin(2*np.pi*f*3*tt))*env
            add(tone,impact,pan=(i-1.5)*.25,gain=.105)
        # Tiny high-frequency trails across the stereo field.
        for i,(ratio,pan) in enumerate([(4,-.65),(5,.65),(6,-.25)]):
            chime=bell(root*ratio,1.3+rank*.08)
            add(chime,impact+.12+i*.08,pan,gain=.06+rank*.003)
            add(chime,impact+.28+i*.08,-pan,gain=.02)
        add(np.sin(2*np.pi*73.416*tt)*np.exp(-tt/.12),impact,gain=.12)
    fade=np.minimum((duration-t)/.25,1)
    y*=fade[:,None];y=np.tanh(y*1.45)
    return y
def save(name,samples):
    wav=Path('tmp')/(name+'.wav')
    with wave.open(str(wav),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((samples*32767).astype('<i2').tobytes())
    subprocess.run([ff,'-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','160k','public/audio/'+name+'.mp3'],check=True)
for rank in range(7):save('rank-'+str(rank),render(rank))
save('card-open',render(2,True))
print('Rendered seven stereo ranked stingers and a dedicated 0.85-second card-opening cue.')
