"""Generates the PWA/app icons from a single definition, so the mark stays
consistent across every size. Re-run after changing the palette."""

from PIL import Image, ImageDraw

TERRACOTTA = (189, 91, 56, 255)
CREAM = (252, 248, 244, 255)
SS = 4  # supersample factor


def draw_pot(size: int, inset: float, rounded: bool) -> Image.Image:
    """inset = fraction of the canvas kept clear around the mark (maskable safe zone)."""
    s = size * SS

    bg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    b = ImageDraw.Draw(bg)
    if rounded:
        b.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=TERRACOTTA)
    else:
        b.rectangle([0, 0, s - 1, s - 1], fill=TERRACOTTA)

    mark = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    m = ImageDraw.Draw(mark)

    box = s * (1 - 2 * inset)
    ox = oy = s * inset

    def px(fx: float, fy: float):
        return ox + box * fx, oy + box * fy

    stroke = max(2, int(box * 0.082))
    rim_y = 0.26
    top, bottom, left, right = 0.02, 0.98, 0.07, 0.93

    # Body: a round-bellied pot, slightly wider than tall.
    m.ellipse([*px(left, top), *px(right, bottom)], outline=CREAM, width=stroke)
    # Cut the belly off above the rim so it reads as an open vessel, not a ball.
    m.rectangle([0, 0, s, oy + box * rim_y], fill=(0, 0, 0, 0))

    # Rim: span the body's actual width at the cut, plus a potter's overhang.
    cx, cy = (left + right) / 2, (top + bottom) / 2
    half_w, half_h = (right - left) / 2, (bottom - top) / 2
    dx = half_w * (1 - ((rim_y - cy) / half_h) ** 2) ** 0.5 + 0.035
    m.line([*px(cx - dx, rim_y), *px(cx + dx, rim_y)], fill=CREAM, width=stroke)

    return Image.alpha_composite(bg, mark).resize((size, size), Image.LANCZOS)


def main():
    draw_pot(512, 0.17, True).save("public/icon-512.png")
    draw_pot(192, 0.17, True).save("public/icon-192.png")
    draw_pot(180, 0.17, False).save("src/app/apple-icon.png")  # Next emits the apple-touch-icon link
    # Maskable icons get cropped to a circle by Android — keep the mark well inside.
    draw_pot(512, 0.27, False).save("public/icon-maskable-512.png")
    print("icons written")


if __name__ == "__main__":
    main()
