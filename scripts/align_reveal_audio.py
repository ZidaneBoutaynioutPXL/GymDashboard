"""Find shared animation frames; report matches for manual sound synchronization review."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('tmp/media-tools').resolve()))
import cv2
import numpy as np

sift=cv2.SIFT_create(nfeatures=400)
matcher=cv2.BFMatcher()
def frame(cap,t):
    cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,img=cap.read()
    if not ok:return None,None
    h,w=img.shape[:2];img=cv2.resize(img,(int(w*min(1,480/w)),int(h*min(1,480/w))))
    return sift.detectAndCompute(cv2.cvtColor(img,cv2.COLOR_BGR2GRAY),None)
groups={'broly':('legends',107,120),'goku':('legends',263,279),'gohan':('legends',293,305),
        'frieza':('legends',319,329),'vegeta':('legends',399,414),
        'cell':('cell',0,60),'trunks':('trunks',412,440),'piccolo':('piccolo',0,57)}
results={}
for name,(reference,start,end) in groups.items():
    if len(sys.argv)>1 and name not in sys.argv[1:]:continue
    cap=cv2.VideoCapture(f'tmp/reveal-candidates/{name}.mp4')
    duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS)
    times=[round(duration*p,2) for p in [.12,.35,.6,.82]]
    targets=[frame(cap,t) for t in times];cap.release()
    ref=cv2.VideoCapture(f'tmp/reveal-originals/{reference}.mp4')
    best=[(0,0) for _ in times]
    for t in np.arange(start,end,.1):
        keys,desc=frame(ref,t)
        if desc is None:continue
        for i,(targetkeys,targetdesc) in enumerate(targets):
            if targetdesc is None:continue
            pairs=matcher.knnMatch(targetdesc,desc,k=2)
            good=[m for pair in pairs if len(pair)==2 for m,n in [pair] if m.distance < .7*n.distance]
            if len(good)<4:continue
            a=np.float32([targetkeys[m.queryIdx].pt for m in good]);b=np.float32([keys[m.trainIdx].pt for m in good])
            _,mask=cv2.findHomography(a,b,cv2.RANSAC,4)
            score=int(mask.sum()) if mask is not None else 0
            if score>best[i][0]:best[i]=(score,round(float(t),2))
    ref.release()
    results[name]=[{'clipTime':t,'referenceTime':r,'matches':s} for t,(s,r) in zip(times,best)]
    print(name,results[name],flush=True)
Path('tmp/reveal-originals/alignment.json').write_text(json.dumps(results,indent=2),encoding='utf8')
