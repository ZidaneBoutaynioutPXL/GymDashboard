"""Build competitor-only streetlifting references from a pinned CC0 archive.
No recovered/inferred bodyweights, failed attempts, future meets or repeated people.
"""
import csv,io,json,math,unicodedata,zipfile
from pathlib import Path
from collections import defaultdict,Counter
import tomli
import requests

SHA='20bf41230c05aebf8c7c0032254c60ad823c3ad4'
CUTOFF='2026-09-23'
archive=Path('tmp/street-data.zip')
if not archive.exists():
    archive.parent.mkdir(exist_ok=True)
    response=requests.get(f'https://codeload.github.com/openstreetlifting/openstreetlifting/zip/{SHA}',timeout=60)
    response.raise_for_status();archive.write_bytes(response.content)
z=zipfile.ZipFile(archive)
assert z.namelist()[0].startswith(f'openstreetlifting-{SHA}/'), 'Archive must match the pinned commit'
records=[];meets={};exclusions=Counter()
def number(s):
    try:return float(s)
    except (TypeError,ValueError):return None
for path in z.namelist():
    if not path.endswith('/entries.csv'):continue
    meta=tomli.loads(z.read(path.replace('entries.csv','competition.toml')).decode('utf-8-sig'))
    if str(meta['competition']['start_date'])>CUTOFF:continue
    slug=path.split('/')[-2]
    for row in csv.DictReader(io.StringIO(z.read(path).decode('utf-8-sig'))):
        if row.get('Status')!='competed':exclusions['not_completed']+=1;continue
        bw=number(row.get('BodyweightKg'))
        if not bw or row.get('BodyweightSource')=='recovered':exclusions['missing_or_recovered_bodyweight']+=1;continue
        if row['Sex'] not in ['M','F']:continue
        name=' '.join(row.get(k,'').strip().casefold() for k in ['FirstName','LastName','Disambiguation','Country'])
        key=unicodedata.normalize('NFKC',name)
        values={lift:number(row.get(col)) for lift,col in [('dip','BestDipsKg'),('pullup','BestPullUpKg')]}
        for lift,value in values.items():
            if value is not None and value>0:records.append(dict(person=key,sex=row['Sex'],bw=bw,lift=lift,value=value,meet=slug))
        meets[slug]={'name':meta['competition']['name'],'date':str(meta['competition']['start_date']),'country':meta['competition'].get('country'),'sources':meta.get('sources',[]),'archive':f'https://openstreetlifting.org/competitions/{slug}'}

PCTS=[0,5,10,25,50,75,90,95,97.5,100]
def quantile(values,p):
    pos=(len(values)-1)*p/100;i=math.floor(pos);j=math.ceil(pos)
    return round(values[i]+(values[j]-values[i])*(pos-i),4)
def cohort(sex,lo=None,hi=None):
    curves={}
    for lift in ['dip','pullup']:
        chosen={}
        for r in records:
            if r['sex']!=sex or r['lift']!=lift or (lo is not None and not lo<=r['bw']<hi):continue
            val=r['value']/r['bw']
            if r['person'] not in chosen or val>chosen[r['person']]['value']/chosen[r['person']]['bw']:chosen[r['person']]=r
        if len(chosen)<30:continue
        ratios=sorted(r['value']/r['bw'] for r in chosen.values())
        curves[lift]={'n':len(ratios),'q':[quantile(ratios,p) for p in PCTS],'meets':len(set(r['meet'] for r in chosen.values()))}
    return curves
result={'version':1,'source':'OpenStreetlifting','commit':SHA,'cutoff':CUTOFF,'percentiles':PCTS,'rankPercentiles':[10,25,50,75,90,97.5],'method':'Best successful added-load/bodyweight ratio per named competitor, completed meets only; reported bodyweights only. No age matching. Country/name/disambiguation deduplication.','exclusions':dict(exclusions),'meets':meets,'cohorts':{}}
for sex in ['M','F']:
    result['cohorts'][sex]={'pooled':cohort(sex),'bands':{}}
    for lo in range(40,141,10):
        c=cohort(sex,lo,lo+10)
        if c:result['cohorts'][sex]['bands'][str(lo)]=c
Path('src/streetBenchmarks.json').write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
print('Meets',len(meets),'exclusions',dict(exclusions))
for sex in ['M','F']:
    for label,c in [('pooled',result['cohorts'][sex]['pooled']),*result['cohorts'][sex]['bands'].items()]:
        print(sex,label,{lift:{'n':v['n'],'rankRatios':[v['q'][PCTS.index(p)] for p in result['rankPercentiles']]} for lift,v in c.items()})
