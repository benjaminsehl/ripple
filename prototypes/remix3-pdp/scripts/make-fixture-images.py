"""Generates the SVG product shots used when mock.shop is unreachable (fixture mode).
Run: python3 scripts/make-fixture-images.py
"""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "fixtures")
os.makedirs(OUT, exist_ok=True)

COLORS = {
    "ochre": "#C8913A",
    "sage": "#8FA58A",
    "ink": "#2B3140",
    "bone": "#E4DCCD",
    "clay": "#B5654A",
}


def mix(hex1, hex2, t):
    a = [int(hex1[i : i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex2[i : i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


def shade(c, t):
    return mix(c, "#000000", t)


def tint(c, t):
    return mix(c, "#ffffff", t)


BODY = (
    "M300 250 C330 215 470 215 500 250 L600 290 C650 310 680 350 690 420 L735 760 L650 778 "
    "L612 480 L612 860 L188 860 L188 480 L150 778 L65 760 L110 420 C120 350 150 310 200 290 Z"
)
TEE = (
    "M310 250 C340 285 460 285 490 250 L610 290 C660 310 700 350 720 420 L650 470 L612 430 "
    "L612 860 L188 860 L188 430 L150 470 L80 420 C100 350 140 310 190 290 Z"
)


def garment(c, kind, view="0 0 800 1000", bg=None, rotate=0):
    bg = bg or mix(c, "#F3EFE8", 0.82)
    dark = shade(c, 0.18)
    darker = shade(c, 0.32)
    light = tint(c, 0.12)
    g = []
    g.append(
        f'<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".10"/>'
        f'<stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>'
        f'<radialGradient id="v" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></radialGradient></defs>'
    )
    g.append(f'<rect width="800" height="1000" fill="{bg}"/><rect width="800" height="1000" fill="url(#v)"/>')
    g.append('<ellipse cx="400" cy="900" rx="260" ry="22" fill="#000" opacity=".08"/>')
    g.append(f'<g transform="rotate({rotate} 400 550)">')
    if kind in ("hoodie", "hoodie-back"):
        if kind == "hoodie":
            g.append(f'<path d="M296 262 C262 150 330 92 400 92 C470 92 538 150 504 262 C470 232 330 232 296 262 Z" fill="{dark}"/>')
            g.append(f'<path d="M330 252 C320 175 360 140 400 140 C440 140 480 175 470 252 C440 238 360 238 330 252 Z" fill="{darker}"/>')
        g.append(f'<path d="{BODY}" fill="{c}"/>')
        g.append(f'<path d="{BODY}" fill="url(#s)"/>')
        g.append(f'<rect x="188" y="822" width="424" height="38" fill="{dark}"/>')
        g.append(f'<path d="M65 760 L150 778 L146 748 L68 732 Z" fill="{dark}"/><path d="M735 760 L650 778 L654 748 L732 732 Z" fill="{dark}"/>')
        g.append(f'<path d="M612 480 L612 820" stroke="{dark}" stroke-width="3" opacity=".5"/><path d="M188 480 L188 820" stroke="{dark}" stroke-width="3" opacity=".5"/>')
        if kind == "hoodie":
            g.append(f'<path d="M282 640 L518 640 L560 795 L240 795 Z" fill="{light}" stroke="{dark}" stroke-width="3"/>')
            g.append(f'<path d="M282 640 L240 795 M518 640 L560 795" stroke="{darker}" stroke-width="5" opacity=".35"/>')
            for x in (372, 428):
                g.append(f'<path d="M{x} 250 C{x+3} 300 {x-3} 340 {x} 392" stroke="{tint(c,0.55)}" stroke-width="7" fill="none" stroke-linecap="round"/>')
                g.append(f'<rect x="{x-6}" y="388" width="12" height="22" rx="3" fill="{tint(c,0.75)}"/>')
        else:
            g.append(f'<path d="M290 252 C280 150 340 108 400 108 C460 108 520 150 510 252 C496 340 304 340 290 252 Z" fill="{dark}"/>')
            g.append(f'<path d="M400 112 L400 330" stroke="{darker}" stroke-width="4" opacity=".5"/>')
    elif kind == "crew":
        g.append(f'<path d="{BODY}" fill="{c}"/><path d="{BODY}" fill="url(#s)"/>')
        g.append(f'<path d="M300 250 C330 300 470 300 500 250" stroke="{dark}" stroke-width="22" fill="none"/>')
        g.append(f'<rect x="188" y="822" width="424" height="38" fill="{dark}"/>')
        g.append(f'<path d="M65 760 L150 778 L146 748 L68 732 Z" fill="{dark}"/><path d="M735 760 L650 778 L654 748 L732 732 Z" fill="{dark}"/>')
    elif kind == "tee":
        g.append(f'<path d="{TEE}" fill="{c}"/><path d="{TEE}" fill="url(#s)"/>')
        g.append(f'<path d="M310 250 C340 285 460 285 490 250" stroke="{dark}" stroke-width="14" fill="none"/>')
    elif kind == "beanie":
        g.append(f'<path d="M210 640 C210 380 300 300 400 300 C500 300 590 380 590 640 Z" fill="{c}"/>')
        for x in range(230, 590, 26):
            g.append(f'<path d="M{x} 640 C{x} 480 {x+ (400-x)*0.2} 380 {400 + (x-400)*0.4} 320" stroke="{dark}" stroke-width="3" fill="none" opacity=".35"/>')
        g.append(f'<rect x="190" y="600" width="420" height="150" rx="26" fill="{dark}"/>')
        for x in range(205, 600, 18):
            g.append(f'<rect x="{x}" y="606" width="7" height="138" rx="3" fill="{darker}" opacity=".35"/>')
        g.append(f'<rect x="355" y="640" width="90" height="56" rx="6" fill="{tint(c,0.8)}"/>')
    elif kind == "tote":
        g.append(f'<path d="M310 420 C310 250 490 250 490 420" stroke="{dark}" stroke-width="26" fill="none"/>')
        g.append(f'<path d="M210 400 L590 400 L620 860 L180 860 Z" fill="{c}"/><path d="M210 400 L590 400 L620 860 L180 860 Z" fill="url(#s)"/>')
        g.append(f'<path d="M210 400 L590 400" stroke="{dark}" stroke-width="10"/>')
        g.append(f'<circle cx="400" cy="610" r="64" fill="none" stroke="{tint(c,0.6)}" stroke-width="8"/>')
    g.append("</g>")
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="800" height="1000" preserveAspectRatio="xMidYMid slice">' + "".join(g) + "</svg>"


def write(name, svg):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg)


for cname, c in COLORS.items():
    write(f"hoodie-{cname}-front.svg", garment(c, "hoodie"))
    write(f"hoodie-{cname}-back.svg", garment(c, "hoodie-back"))
    write(f"hoodie-{cname}-detail.svg", garment(c, "hoodie", view="240 140 320 400"))
    write(f"hoodie-{cname}-styled.svg", garment(c, "hoodie", bg=mix(c, "#1d1b19", 0.55), rotate=-7))
    write(f"crew-{cname}.svg", garment(c, "crew"))
    write(f"tee-{cname}.svg", garment(c, "tee"))
    write(f"beanie-{cname}.svg", garment(c, "beanie"))
    write(f"tote-{cname}.svg", garment(c, "tote"))
print("ok", len(os.listdir(OUT)))
