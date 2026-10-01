"""Snapshot public Strength Level bodyweight tables (not age-adjusted)."""
import json, re
from pathlib import Path
import requests
from bs4 import BeautifulSoup

slugs = dict(bench='bench-press', squat='squat', deadlift='deadlift', ohp='shoulder-press', dip='dips', pullup='pull-ups')
result = {'retrieved': '2026-09-23', 'percentiles': [5,20,50,80,95], 'lifts': {}}
for key, slug in slugs.items():
    url=f'https://strengthlevel.com/strength-standards/{slug}/kg'
    response=requests.get(url,timeout=45); response.raise_for_status()
    soup=BeautifulSoup(response.text,'html.parser')
    tables=[]
    for table in soup.select('table'):
        rows=[[c.get_text(' ',strip=True) for c in row.select('th,td')] for row in table.select('tr')]
        if rows and rows[0][0]=='BW':
            # Weighted calisthenics has repetition tables as well; only kg is a load table.
            if key in ['dip','pullup'] and 'kg' not in table.get_text(): continue
            parsed=[]
            for row in rows[1:]:
                if len(row)!=6: continue
                parsed.append([float(re.sub(r'[^0-9.\-]','',v)) for v in row])
            assert len(parsed)>5 and all(len(row)==6 for row in parsed)
            tables.append(parsed)
    assert len(tables)==2, (key,len(tables))
    metadata={}
    for table in soup.select('table'):
        if 'Data cutoff' in table.get_text():
            for row in table.select('tr'):
                cells=[c.get_text(' ',strip=True) for c in row.select('th,td')]
                if len(cells)==2: metadata[cells[0]]=cells[1]
    result['lifts'][key]={'url':url,'M':tables[0],'F':tables[1],'metadata':metadata}
    print(key,len(tables[0]),len(tables[1]),metadata)
Path('src/globalBenchmarks.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
