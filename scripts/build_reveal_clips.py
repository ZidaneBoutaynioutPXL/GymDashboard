"""Encode reviewed local character animations and record their provenance."""
import json
import hashlib
import subprocess
from pathlib import Path
import imageio_ffmpeg

root = Path('tmp/reveal-candidates')
dest = Path('public/cinematics/finals');dest.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / 'selected.json').read_text(encoding='utf8'))
audio_sources = json.loads(Path('scripts/reveal_audio_sources.json').read_text(encoding='utf8'))
labels = {
    'vegeta': ('Majin Vegeta', 'Legends ink intro'),
    'broly': ('Legendary Super Saiyan Broly', 'Legends ink intro'),
    'gohan': ('Super Saiyan 2 Gohan', 'Legends ink intro'),
    'frieza': ('Golden Frieza', 'Legends ink intro'),
    'cell': ('Perfect Cell', 'Legends character action'),
    'goku': ('Ultra Instinct Sign Goku', 'Legends ink intro'),
    'trunks': ('Sword of Hope Trunks', 'Sparking! Zero action'),
    'piccolo': ('Orange Piccolo', 'Transformation animation'),
}
for name, info in manifest.items():
    output = dest / f'{name}.mp4'
    audio = audio_sources[name]
    recording = Path(f'tmp/reveal-originals/{audio["recording"]}.mp4')
    if not recording.exists():
        raise FileNotFoundError(f'{recording}: run scripts/fetch_original_reveal_audio.py first')
    # Keep the existing video edit. Match its original action audio using reviewed
    # frame anchors, preserving voice pitch when the silent edit changes speed.
    duration = info['duration']
    filters=[]; elapsed=0
    for i, segment in enumerate(audio['segments']):
        length=segment.get('duration',duration-elapsed)
        start=segment['start'];rate=segment['rate']
        filters.append(f'[1:a]atrim=start={start}:end={start+length*rate},asetpts=PTS-STARTPTS,atempo={rate},apad,atrim=duration={length}[a{i}]')
        elapsed+=length
    streams=''.join(f'[a{i}]' for i in range(len(audio['segments'])))
    filters.append(f'{streams}concat=n={len(audio["segments"])}:v=0:a=1,afade=t=in:d=0.015,afade=t=out:st={duration-.06}:d=0.06,alimiter=limit=0.95:level=false[audio]')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(root/f'{name}.mp4'),
                    '-i', str(recording), '-filter_complex', ';'.join(filters),
                    '-map', '0:v:0', '-map', '[audio]',
                    *(['-vf', 'crop=240:264:120:0'] if name == 'goku' else []),
                    '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '48000',
                    '-c:v', 'libx264', '-crf', '28' if name == 'piccolo' else '24', '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)], check=True, capture_output=True)
    assert output.stat().st_size < 2_000_000, f'{name}: exceeds offline asset budget'
    info.update(form=labels[name][0], kind=labels[name][1], src=f'/cinematics/finals/{name}.mp4',
                sha256=hashlib.sha256(output.read_bytes()).hexdigest(), bytes=output.stat().st_size,
                audio={'source':audio['source'],'segments':audio['segments'],'embedded':True,'description':'Original scene recording, trimmed and retimed to the existing visual edit'})
    print(name, output.stat().st_size)
Path('src/revealClips.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
