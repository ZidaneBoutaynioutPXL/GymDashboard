"""Cache sound-bearing reference recordings for the final reveals."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path('tmp/media-tools').resolve()))
import yt_dlp
import imageio_ffmpeg

sources={'legends':'33S0W56E76A','cell':'QBGSkpQGPkw','trunks':'k4sng91-TnA','piccolo':'Dbz8G0swjZ4'}
for name,video in sources.items():
    if Path(f'tmp/reveal-originals/{name}.mp4').exists():continue
    options={'js_runtimes':{'node':{}},'remote_components':['ejs:github'],'format':'134+140/bv[height<=360]+ba',
             'ffmpeg_location':imageio_ffmpeg.get_ffmpeg_exe(),'outtmpl':f'tmp/reveal-originals/{name}.%(ext)s',
             'writeinfojson':True,'quiet':True,'noprogress':True,'merge_output_format':'mp4'}
    try:
        with yt_dlp.YoutubeDL(options) as y:y.download([f'https://www.youtube.com/watch?v={video}'])
        print(name,'downloaded',flush=True)
    except yt_dlp.utils.DownloadError as e:print(name,str(e),flush=True)
