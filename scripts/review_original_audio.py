"""Make timestamped frame sheets to align original recordings to silent excerpts."""
import subprocess
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw
import imageio_ffmpeg

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
for name,start,length in [('broly',107,19),('goku',263,26),('gohan',289,22),('frieza',311,29),('vegeta',397,23)]:
    sheet=Image.new('RGB',(1000,((length+9)//10)*160),'#142032');draw=ImageDraw.Draw(sheet)
    for i in range(length):
        data=subprocess.run([ffmpeg,'-ss',str(start+i),'-i','tmp/reveal-originals/legends.mp4','-frames:v','1','-f','image2pipe','-vcodec','png','-'],capture_output=True,check=True).stdout
        im=Image.open(BytesIO(data));im.thumbnail((100,135))
        x,y=i%10*100,i//10*160;sheet.paste(im,(x,y));draw.text((x,y+138),str(start+i),fill='white')
    sheet.save(f'tmp/reveal-originals/{name}.jpg')
