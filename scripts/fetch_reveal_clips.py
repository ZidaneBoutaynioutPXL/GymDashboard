"""Download selected reference clips locally and create frame strips for review."""
import json
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
import imageio_ffmpeg

root = Path('tmp/reveal-candidates')
selected = {'vegeta': ('ultra-majin-vegeta', 3), 'broly': ('broly-ink', 0),
            'gohan': ('beast-gohan-ink', 0), 'frieza': ('frieza-ink-art', 0),
            'cell': ('ultra-cell', 7), 'goku': ('ui-goku-ink', 2),
            'trunks': ('sword-of-hope-trunks', 8), 'piccolo': ('orange-piccolo-transformation', 2)}

def fetch(pair):
    name, (query, index) = pair
    item = json.loads((root / f'{query}.json').read_text(encoding='utf8'))[index]
    media = item['media_formats']['mp4']
    dest = root / f'{name}.mp4'
    if not dest.exists() or not (root / f'{name}.source').exists() or (root / f'{name}.source').read_text(encoding='utf8') != media['url']:
        r = requests.get(media['url'], timeout=60);r.raise_for_status();dest.write_bytes(r.content)
        (root / f'{name}.source').write_text(media['url'], encoding='utf8')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(dest), '-vf',
                    f'fps=6/{media["duration"]},scale=180:-1,tile=6x1', '-frames:v', '1',
                    str(root / f'{name}-frames.jpg')], check=True, capture_output=True)
    return name, {'source': item['itemurl'], 'download': media['url'], 'duration': media['duration'], 'dims': media['dims']}

with ThreadPoolExecutor(max_workers=4) as pool:
    manifest = dict(pool.map(fetch, selected.items()))
(root / 'selected.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
print(json.dumps(manifest, indent=2))
