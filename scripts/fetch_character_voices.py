"""Cache credited character archives for the personal app's voice packs."""
from pathlib import Path
import requests
from bs4 import BeautifulSoup

packs={'vegeta':446045,'broly':445968,'trunks':446039,'piccolo':446052,'gohan':445951,'frieza':443695,'cell':443693}
root=Path('tmp/character-voices');root.mkdir(parents=True,exist_ok=True)
for name,asset in packs.items():
    dest=root/f'{name}.zip'
    if dest.exists():
        print(name,'cached',dest.stat().st_size,flush=True);continue
    url=f'https://sounds.spriters-resource.com/mobile/dragonballlegends/asset/{asset}/'
    r=requests.get(url,timeout=45);r.raise_for_status()
    (root/f'{name}.html').write_text(r.text,encoding='utf8')
    link=BeautifulSoup(r.text,'html.parser').select_one('#download')['href']
    data=requests.get('https://sounds.spriters-resource.com'+link,timeout=90);data.raise_for_status()
    if not data.content.startswith(b'PK'):raise ValueError('Expected ZIP archive')
    dest.write_bytes(data.content)
    print(name,len(data.content),url,flush=True)
