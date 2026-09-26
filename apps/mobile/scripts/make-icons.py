"""Generates FitLog's placeholder app icons from the design tokens.

    python3 apps/mobile/scripts/make-icons.py

A barbell in the IRIS accent on the app's ink background — store-valid (no
transparency on the iOS icon, the Android foreground inside the adaptive safe
zone) so builds can be submitted before final artwork exists. Replace the PNGs
in assets/ with the real artwork; nothing else changes.
"""
from pathlib import Path

from PIL import Image, ImageDraw

INK = (14, 15, 17, 255)          # --page / splash background, docs/design/tokens.css
ACCENT = (176, 164, 255, 255)    # --accent (IRIS)
S = 4                            # supersample, then downscale for clean edges
OUT = Path(__file__).resolve().parents[1] / "assets"


def barbell(size: int, scale: float, color) -> Image.Image:
    """The mark, centred, occupying `scale` of the canvas width."""
    big = size * S
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = big * scale
    cx, cy = big / 2, big / 2
    bar_h = w * 0.07
    d.rounded_rectangle([cx - w / 2, cy - bar_h / 2, cx + w / 2, cy + bar_h / 2], radius=bar_h / 2, fill=color)
    # Two plates each side, the inner one taller, like a loaded bar seen side-on.
    for side in (-1, 1):
        for offset, height, thick in ((0.30, 0.62, 0.085), (0.415, 0.44, 0.07)):
            x = cx + side * w * offset
            h = w * height
            t = w * thick
            d.rounded_rectangle([x - t / 2, cy - h / 2, x + t / 2, cy + h / 2], radius=t * 0.35, fill=color)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    # iOS / store icon: opaque, full bleed (the OS rounds the corners).
    icon = Image.new("RGBA", (1024, 1024), INK)
    icon.alpha_composite(barbell(1024, 0.70, ACCENT))
    icon.convert("RGB").save(OUT / "icon.png")
    # Android adaptive foreground: transparent, mark inside the central 66 %.
    barbell(1024, 0.55, ACCENT).save(OUT / "adaptive-icon.png")
    # Play Store listing icon: 512 × 512, opaque.
    icon.convert("RGB").resize((512, 512), Image.LANCZOS).save(OUT / "play-store-icon.png")
    # Android notification small icon: white silhouette on transparent.
    barbell(96, 0.8, (255, 255, 255, 255)).save(OUT / "notification-icon.png")
    print("wrote", ", ".join(p.name for p in sorted(OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
