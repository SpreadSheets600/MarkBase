"""Generate the MarkBase icons (with a little 'M' monogram) for the extension + PWA."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT_EXT = "/home/soham/Projects/markbase/extension/icons"
OUT_PWA = "/home/soham/Projects/markbase/api/public/icons"
os.makedirs(OUT_EXT, exist_ok=True)
os.makedirs(OUT_PWA, exist_ok=True)

def hex_gradient(x, y):
    t = (x + y) / 2
    stops = [(99, 102, 241), (168, 85, 247), (236, 72, 153)]
    return tuple(int(a + (b - a) * t) for a, b in zip(stops[0], stops[2]))

def render(size: int) -> Image.Image:
    s = size * 4  # supersample
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(s * 0.24)
    # gradient base
    grad = Image.new("RGBA", (s, s))
    gd = ImageDraw.Draw(grad)
    for yy in range(s):
        for_getter = hex_gradient(0, yy)
        gd.line([(0, yy), (s, yy)], fill=for_getter + (255,))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([2, 2, s - 2, s - 2], radius=radius, fill=255)
    img.paste(grad, (0, 0), mask)
    # monogram
    text = "M"
    font = None
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    ]:
        if os.path.exists(path):
            font = ImageFont.truetype(path, int(s * 0.55))
            break
    if font is None:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((s - w) / 2 - bbox[0], (s - h) / 2 - bbox[1]), text, fill=(255, 255, 255, 255), font=font)
    return img.resize((size, size), Image.LANCZOS)

for size in (16, 32, 48, 128):
    render(size).save(f"{OUT_EXT}/icon{size}.png")
for size in (192, 512):
    render(size).save(f"{OUT_PWA}/icon{size}.png")
print("icons done")
