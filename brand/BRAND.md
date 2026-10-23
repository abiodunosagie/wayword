# Wayword brand

**Idea.** A tag, the kind you tie to a thing to say what it is. The app is about putting words on
the things around you, so the mark is the label itself: the marigold dot is where the tag is tied
to the world, and the two lines are the word and what it means.

**Colours** (the same values as `src/theme/colors.ts`)

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#FFFFFF` | `#0E1016` |
| Ink | `#12141A` | `#F4F1EA` |
| Muted | `#5E636E` | `#9DA2AD` |
| Accent (the tag) | Cobalt `#2346B5` | Sky `#8AA2FF` |
| The dot | Marigold `#F2A93B` | Marigold `#F2A93B` |

**Type.** Schibsted Grotesk (SIL Open Font License), ExtraBold for the name, Regular for lines.
Every file has its text outlined, so nothing depends on an installed font.

**Files** (all from `python3 brand/generate.py`)

- `kit/wayword-symbol*.svg`: the mark in colour, dark, black and white. The one-colour versions cut
  the dot and lines out, so they read on any background.
- `kit/wayword-lockup*.svg`, `kit/wayword-wordmark*.svg`: the mark with the name, and the name alone.
- `kit/wayword-app-icon.svg` and the Android adaptive layers, exported into `assets/` for Expo.
- `banner.svg`, `banner-dark.svg`: the animated README header. It plays once and respects reduced
  motion; the last frame is the resting design.
- `kit/social-preview.svg` and `banner.png`: the GitHub social preview, 1280 by 640.

**Do not** recolour the dot, stretch the tag, or set the name in another font.
