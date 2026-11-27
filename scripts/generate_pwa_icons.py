#!/usr/bin/env python3
"""
Generate high-DPI PNG PWA icons for BioStudio matching public/favicon.svg.

Outputs (under public/icons/):
  - icon-192.png           (192x192, purpose: any)
  - icon-512.png           (512x512, purpose: any)
  - icon-maskable-192.png  (192x192, purpose: maskable, Android adaptive safe-zone)
  - icon-maskable-512.png  (512x512, purpose: maskable, Android adaptive safe-zone)
  - apple-touch-icon.png   (180x180, opaque full-bleed for iOS Home Screen)
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"

BG_COLOR = (27, 29, 36, 255)          # #1b1d24
BORDER_COLOR = (59, 61, 67, 255)      # rgba(255, 255, 255, 0.14) blended over #1b1d24
TEAL_RING = (64, 200, 224, 255)       # #40c8e0
BLUE_CORE = (10, 132, 255, 255)       # #0a84ff
GREEN_DOT = (48, 209, 88, 255)        # #30d158


def draw_icon(size: int, *, maskable: bool = False, opaque_square: bool = False) -> Image.Image:
    # 4x supersampling for crisp anti-aliased circles and strokes
    ss = 4
    canvas_size = size * ss
    img = Image.new("RGBA", (canvas_size, canvas_size), BG_COLOR if (maskable or opaque_square) else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    unit = canvas_size / 64.0

    if not maskable and not opaque_square:
        # Rounded square matching favicon.svg (rx=16 on 64x64)
        draw.rounded_rectangle(
            [0, 0, canvas_size - 1, canvas_size - 1],
            radius=round(16 * unit),
            fill=BG_COLOR,
        )
        inset = round(2 * unit)
        draw.rounded_rectangle(
            [inset, inset, canvas_size - 1 - inset, canvas_size - 1 - inset],
            radius=round(14 * unit),
            outline=BORDER_COLOR,
            width=max(1, round(2 * unit)),
        )

    # Scale emblem slightly down on maskable icons so it stays well inside Android's 80% safe zone
    scale = 0.80 if maskable else (0.90 if opaque_square else 1.0)
    cx = canvas_size / 2.0
    cy = canvas_size / 2.0

    def circle_bbox(x_rel: float, y_rel: float, r_rel: float) -> list[float]:
        x = cx + (x_rel - 32.0) * unit * scale
        y = cy + (y_rel - 32.0) * unit * scale
        r = r_rel * unit * scale
        return [x - r, y - r, x + r, y + r]

    # Outer teal membrane ring (r=18, stroke-width=3.5)
    ring_width = max(1, round(3.5 * unit * scale))
    # PIL ellipse outline grows inward from bbox, so expand radius by half stroke width
    draw.ellipse(
        circle_bbox(32.0, 32.0, 18.0 + 3.5 / 2.0),
        outline=TEAL_RING,
        width=ring_width,
    )

    # Center blue nucleus (r=8)
    draw.ellipse(circle_bbox(32.0, 32.0, 8.0), fill=BLUE_CORE)

    # Top-right green organelle dot (cx=43, cy=21, r=3)
    draw.ellipse(circle_bbox(43.0, 21.0, 3.0), fill=GREEN_DOT)

    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    specs = [
        ("icon-192.png", 192, False, False),
        ("icon-512.png", 512, False, False),
        ("icon-maskable-192.png", 192, True, False),
        ("icon-maskable-512.png", 512, True, False),
        ("apple-touch-icon.png", 180, False, True),
    ]
    for filename, size, maskable, opaque_square in specs:
        out_path = OUT_DIR / filename
        icon = draw_icon(size, maskable=maskable, opaque_square=opaque_square)
        if maskable or opaque_square:
            icon = icon.convert("RGB")
        icon.save(out_path, format="PNG", optimize=True)
        print(f"Generated {out_path.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
