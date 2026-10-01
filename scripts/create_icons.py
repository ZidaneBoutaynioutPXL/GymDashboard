from PIL import Image, ImageDraw


def make_icon(size: int) -> None:
    image = Image.new('RGB', (size, size), '#0b1321')
    draw = ImageDraw.Draw(image)
    pad = size * 0.1
    draw.rounded_rectangle((pad, pad, size-pad, size-pad), radius=size*0.2, fill='#172438', outline='#cb8430', width=max(2, size//100))
    points = [
        (.57, .18), (.28, .52), (.46, .52), (.39, .82),
        (.75, .39), (.55, .39),
    ]
    draw.polygon([(int(x*size), int(y*size)) for x, y in points], fill='#ffb643')
    image.save(f'public/icon-{size}.png')


for icon_size in (192, 512):
    make_icon(icon_size)
