"""Build the favicon set from the ALU3 mark.

Usage (needs Pillow: `pip install pillow`):
    python3 scripts/generate-favicon.py docs/design/brand/alu3-mark-source.jpg public

The source is a square JPEG of a metal hexagon on a black background. The black
outside the hexagon becomes transparent, the hexagon is cropped to a square, and
these files are written to the output directory:
    favicon.ico           16, 32 and 48 px
    favicon-192.png       for browsers that pick the largest PNG icon
    apple-touch-icon.png  180 px on graphite, since iOS does not keep transparency
"""
import sys
from PIL import Image, ImageDraw, ImageFilter

GRAPHITE = (0x1C, 0x20, 0x24, 255)
THRESHOLD = 40  # luminance that separates the mark from the black background


def cut_out(src: Image.Image) -> Image.Image:
    rgb = src.convert('RGB')
    lum = rgb.convert('L').point(lambda v: 255 if v > THRESHOLD else 0)
    # Flood the background from a corner: dark areas enclosed by the frame
    # (the inner groove, the letters) are not reached and stay opaque.
    ImageDraw.floodfill(lum, (0, 0), 128)
    alpha = lum.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    left, top, right, bottom = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    side = max(right - left, bottom - top)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    box = tuple(round(v) for v in (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2))
    return out.crop(box)


def main(source: str, out_dir: str) -> None:
    mark = cut_out(Image.open(source))
    mark.resize((256, 256), Image.LANCZOS).save(
        f'{out_dir}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)]
    )
    mark.resize((192, 192), Image.LANCZOS).save(f'{out_dir}/favicon-192.png', optimize=True)
    touch = Image.new('RGBA', (180, 180), GRAPHITE)
    inner = mark.resize((150, 150), Image.LANCZOS)
    touch.alpha_composite(inner, (15, 15))
    touch.convert('RGB').save(f'{out_dir}/apple-touch-icon.png', optimize=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
