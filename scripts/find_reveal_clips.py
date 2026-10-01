"""Cache animation candidates and thumbnail sheets for visual review (no app edits)."""
import json
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw

root = Path('tmp/reveal-candidates')
root.mkdir(parents=True, exist_ok=True)
queries = sys.argv[1:] or ['ultra-majin-vegeta', 'broly-ink', 'ultra-trunks', 'orange-piccolo-legends', 'ultra-beast-gohan', 'ultra-golden-frieza', 'ultra-cell', 'ultra-ui-goku']

def fetch(query):
    cache = root / f'{query}.json'
    if cache.exists():
        items = json.loads(cache.read_text(encoding='utf8'))
    else:
        response = requests.get(f'https://tenor.com/search/{query}-gifs', timeout=40)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        data = json.loads(soup.find('script', id='store-cache').text)
        items = next(iter(data['universal']['search'].values()))['results'][:24]
        cache.write_text(json.dumps(items, indent=2), encoding='utf8')
    sheet = Image.new('RGB', (960, ((len(items)+7)//8)*180), '#152030')
    draw = ImageDraw.Draw(sheet)
    def thumb(pair):
        i, item = pair
        try:
            preview = item['media_formats']['gifpreview']['url']
            r = requests.get(preview, timeout=25);r.raise_for_status()
            im = Image.open(BytesIO(r.content)).convert('RGB');im.thumbnail((116,150))
            return i, im
        except Exception:
            return i, None
    with ThreadPoolExecutor(max_workers=6) as pool:
        for i, im in pool.map(thumb, enumerate(items)):
            x,y=(i%8)*120,(i//8)*180
            if im: sheet.paste(im,(x,y))
            duration=items[i]['media_formats'].get('mp4',{}).get('duration',0)
            draw.text((x,y+152),f'{i}: {duration}s',fill='white')
    sheet.save(root / f'{query}.jpg')
    print(query, len(items), flush=True)

with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(fetch, queries))
