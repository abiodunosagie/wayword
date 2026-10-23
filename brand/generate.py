"""Builds every Wayword brand file from one place: the mark, lockups, wordmark, the app icon set
Expo reads from assets/, the animated README banners and the social preview. Text is outlined from
the bundled font (brand/fonts, SIL Open Font License), so no file depends on a font being installed.

Run from the repo root:  python3 brand/generate.py
PNG exports need headless Chrome.
"""
import math
import pathlib
import shutil
import subprocess

from textpath import font, glyph_bounds, text_path

ROOT = pathlib.Path(__file__).resolve().parents[1]
BRAND = ROOT / 'brand'
KIT = BRAND / 'kit'
PNG = KIT / 'png'
ASSETS = ROOT / 'assets'

# Palette (matches src/theme/colors.ts).
COBALT, SKY, MARIGOLD, INK, PAPER, NIGHT, MUTED, MUTED_DARK = (
    '#2346B5', '#8AA2FF', '#F2A93B', '#12141A', '#F4F1EA', '#0E1016', '#5E636E', '#9DA2AD')

WORD = font('SchibstedGrotesk[wght].ttf', wght=800)
BODY = font('SchibstedGrotesk[wght].ttf', wght=400)


def _tag_path():
    """The mark: a tag, the kind you tie to a thing to say what it is. Point on the left, four
    rounded corners on a 256 grid. The marigold dot is where it is tied to the world; the two
    lines are the word and what it means."""
    pts = [(28, 128), (92, 52), (228, 52), (228, 204), (92, 204)]
    radii = [22, 26, 26, 26, 26]

    def toward(p, q, r):
        length = math.hypot(q[0] - p[0], q[1] - p[1])
        return (p[0] + (q[0] - p[0]) * r / length, p[1] + (q[1] - p[1]) * r / length)

    corners = []
    for i, p in enumerate(pts):
        corners.append((toward(p, pts[i - 1], radii[i]), p, toward(p, pts[(i + 1) % len(pts)], radii[i])))
    d = 'M{:.1f} {:.1f}'.format(*corners[0][2])
    for start, p, end in corners[1:] + corners[:1]:
        d += 'L{:.1f} {:.1f}Q{} {} {:.1f} {:.1f}'.format(*start, *p, *end)
    return d + 'Z'


TAG = _tag_path()
LINES = 'M130 106H196M130 150H172'


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>'


def mark(tag, dot, lines, scale=1.0, dx=0.0, dy=0.0, cls=('', '', '')):
    t = f'translate({dx} {dy}) translate(128 128) scale({scale}) translate(-128 -128)'
    c = [f' class="{k}"' if k else '' for k in cls]
    return (f'<g transform="{t}"><path{c[0]} fill="{tag}" d="{TAG}"/>'
            f'<circle{c[1]} cx="84" cy="128" r="18" fill="{dot}"/>'
            f'<path{c[2]} d="{LINES}" fill="none" stroke="{lines}" stroke-width="20" stroke-linecap="round"/></g>')


def write(name, text):
    (KIT / name).write_text(text)


def symbols():
    write('wayword-symbol.svg', svg(256, 256, mark(COBALT, MARIGOLD, PAPER)))
    write('wayword-symbol-dark.svg', svg(256, 256, mark(SKY, MARIGOLD, NIGHT)))
    # One colour: the dot and lines become holes so the mark still reads on any background.
    one = (f'<path fill="{{c}}" fill-rule="evenodd" d="{TAG}M84 110a18 18 0 1 0 0.01 0Z'
           'M140 96h56a10 10 0 0 1 0 20h-56a10 10 0 0 1 0-20Z'
           'M140 140h32a10 10 0 0 1 0 20h-32a10 10 0 0 1 0-20Z"/>')
    write('wayword-symbol-black.svg', svg(256, 256, one.format(c='#000')))
    write('wayword-symbol-white.svg', svg(256, 256, one.format(c='#fff')))
    # The app icon: a paper tag on cobalt.
    write('wayword-app-icon.svg', svg(256, 256, f'<rect width="256" height="256" fill="{COBALT}"/>'
                                      + mark(PAPER, MARIGOLD, COBALT, 0.74, dx=-4)))
    # Android adaptive layers: the launcher masks to a circle inside a 66% safe zone.
    write('wayword-adaptive-foreground.svg', svg(256, 256, mark(PAPER, MARIGOLD, COBALT, 0.6, dx=-3)))
    write('wayword-adaptive-background.svg', svg(256, 256, f'<rect width="256" height="256" fill="{COBALT}"/>'))
    write('wayword-adaptive-monochrome.svg', svg(256, 256, f'<g transform="translate(128 128) scale(0.6) translate(-128 -128)">'
                                                 + one.format(c='#fff') + '</g>'))


def lockups():
    size, sym, gap = 150, 200, 30
    x0, _, x1, y1 = glyph_bounds(WORD, 'wayword', size)
    d, _ = text_path(WORD, 'wayword', size, x=sym + gap - x0, baseline=178)
    width = int(sym + gap + (x1 - x0) + 8)
    for name, tag, lines, ink in [
        ('wayword-lockup.svg', COBALT, PAPER, INK),
        ('wayword-lockup-dark.svg', SKY, NIGHT, PAPER),
    ]:
        body = (f'<g transform="translate(-8 28) scale({sym / 256})">{mark(tag, MARIGOLD, lines)}</g>'
                f'<path fill="{ink}" d="{d}"/>')
        write(name, svg(width, 256, body))
    d, _ = text_path(WORD, 'wayword', size, x=-x0 + 4, baseline=150)
    for name, ink in [('wayword-wordmark.svg', INK), ('wayword-wordmark-dark.svg', PAPER)]:
        write(name, svg(int(x1 - x0 + 8), 200, f'<path fill="{ink}" d="{d}"/>'))


def banner(dark):
    """The README header: the tag swings in, its dot lands, the word and its meaning are written
    on it, then the name and the line appear. CSS runs once and respects reduced motion; the
    last frame is the resting design."""
    w, h = 1280, 360
    bg, tag, lines, ink, sub = (NIGHT, SKY, NIGHT, PAPER, MUTED_DARK) if dark else ('#FFFFFF', COBALT, PAPER, INK, MUTED)
    word, _ = text_path(WORD, 'wayword', 128, x=380, baseline=190)
    line1, _ = text_path(BODY, 'Learn the language of the place you live.', 34, x=384, baseline=250)
    line2, _ = text_path(BODY, 'Snap a sign, a menu or a letter. Claude turns it into words you keep.', 23, x=384, baseline=290)
    style = '''<style>
.g{transform-box:fill-box;transform-origin:20% 50%;animation:g 1s cubic-bezier(.2,.8,.2,1) both}
.d{transform-box:fill-box;transform-origin:center;animation:d .5s cubic-bezier(.3,1.6,.5,1) .6s both}
.w{stroke-dasharray:70;animation:w .7s ease-out .8s both}
.t{animation:t .8s ease-out 1.1s both}
.s{animation:t .8s ease-out 1.35s both}
@keyframes g{from{transform:translateX(-60px) rotate(-14deg);opacity:0}to{transform:none;opacity:1}}
@keyframes d{from{transform:scale(0)}to{transform:none}}
@keyframes w{from{stroke-dashoffset:70}to{stroke-dashoffset:0}}
@keyframes t{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.g,.d,.w,.t,.s{animation:none}}
</style>'''
    body = (style + f'<rect width="{w}" height="{h}" fill="{bg}"/>'
            + mark(tag, MARIGOLD, lines, 1.0, dx=72, dy=52, cls=('g', 'd', 'w'))
            + f'<path class="t" fill="{ink}" d="{word}"/>'
            f'<path class="s" fill="{ink}" d="{line1}"/><path class="s" fill="{sub}" d="{line2}"/>')
    return svg(w, h, body)


def social():
    w, h = 1280, 640
    word, _ = text_path(WORD, 'wayword', 148, x=440, baseline=330)
    line, _ = text_path(BODY, 'Learn the language of the place you live', 38, x=446, baseline=400)
    feats, _ = text_path(BODY, 'Snap it  ·  Claude explains it  ·  Keep the words  ·  Practise them', 26, x=446, baseline=452)
    body = (f'<rect width="{w}" height="{h}" fill="{COBALT}"/>' + mark(PAPER, MARIGOLD, COBALT, 1.2, dx=140, dy=192)
            + f'<path fill="{PAPER}" d="{word}"/><path fill="{PAPER}" d="{line}"/><path fill="{MARIGOLD}" d="{feats}"/>')
    return svg(w, h, body)


def chrome():
    for path in ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', shutil.which('chromium'), shutil.which('google-chrome')]:
        if path and pathlib.Path(path).exists():
            return path
    raise SystemExit('Headless Chrome is needed for the PNG exports.')


def png(svg_path, out, size):
    w, h = size
    html = KIT / '_render.html'
    html.write_text(f'<html><body style="margin:0;background:transparent">'
                    f'<img src="{svg_path.as_uri()}" style="width:{w}px;height:{h}px;display:block"></body></html>')
    subprocess.run([chrome(), '--headless=new', '--disable-gpu', '--hide-scrollbars',
                    '--default-background-color=00000000', f'--window-size={w},{h}',
                    f'--screenshot={out}', html.as_uri()], check=True, capture_output=True)
    html.unlink()


if __name__ == '__main__':
    PNG.mkdir(parents=True, exist_ok=True)
    symbols()
    lockups()
    (BRAND / 'banner.svg').write_text(banner(dark=False))
    (BRAND / 'banner-dark.svg').write_text(banner(dark=True))
    write('social-preview.svg', social())
    png(BRAND / 'kit/social-preview.svg', BRAND / 'banner.png', (1280, 640))
    png(KIT / 'wayword-lockup.svg', PNG / 'lockup-1200.png', (1200, 325))
    # What app.json points at.
    png(KIT / 'wayword-app-icon.svg', ASSETS / 'icon.png', (1024, 1024))
    png(KIT / 'wayword-adaptive-foreground.svg', ASSETS / 'android-icon-foreground.png', (1024, 1024))
    png(KIT / 'wayword-adaptive-background.svg', ASSETS / 'android-icon-background.png', (1024, 1024))
    png(KIT / 'wayword-adaptive-monochrome.svg', ASSETS / 'android-icon-monochrome.png', (1024, 1024))
    png(KIT / 'wayword-symbol.svg', ASSETS / 'splash-icon.png', (1024, 1024))
    png(KIT / 'wayword-symbol-dark.svg', ASSETS / 'splash-icon-dark.png', (1024, 1024))
    png(KIT / 'wayword-app-icon.svg', ASSETS / 'favicon.png', (48, 48))
    print('Brand kit written to', KIT, 'and', ASSETS)
