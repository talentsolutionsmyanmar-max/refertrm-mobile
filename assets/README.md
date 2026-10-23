# Brand and Play assets

Canonical artwork for in-app header:

- `brand/trm-mark.png` / `@2x` / `@3x` — colour TRM mark (37×22 @1x). Height 22 is the floor; letters are tiny illustrations and smudge below that. No `tintColor`.

Background for launcher and Play icons: `#2B3767`, the flat field of the official site logo (`public/logo.png` in the ReferTRM repo). Paths in `app.json` are unchanged.

| File | Size | Notes |
| --- | --- | --- |
| `icon.png` | 1024×1024 RGB | Expo app icon and splash image, no alpha |
| `play/icon-512.png` | 512×512 RGB | Play Console high-res icon. No transparency. Wordmark about 82% of the width. |
| `play/feature-graphic.png` | 1024×500 RGB | Existing feature graphic. Not regenerated from the site logo. |
| `adaptive-icon.png` | 1024×1024 RGBA | Expo adaptive foreground. Whole logo inside the safe circle, transparent field. |
| `play/adaptive-foreground-432.png` | 432×432 RGBA | Same foreground at the xxxhdpi adaptive size |
| `play/adaptive-background-432.png` | 432×432 RGB | Solid `#2B3767` |
| `launcher/ic_launcher-*.png` | 48–192 RGB | mdpi–xxxhdpi, same official logo |

## Launcher icon — official site logo

The square icons are the official ReferTRM logo used in the header on https://www.refertrm.com (`/logo.png`), not a redrawn compact TRM. Source file: `public/logo.png` in talentsolutionsmyanmar-max/ReferTRM, 3073×1845, the highest-resolution copy of that header logo. Colors and letter shapes are the source pixels. On the adaptive icon, splash, and launcher sizes the wordmark is about 56% of the width so the whole logo stays inside Android’s safe circle (diameter 66/108 of the canvas). The Play store icon `play/icon-512.png` is not round-cropped, so the same original is resampled larger: the wordmark is about 82% of that 512×512 canvas, centered on `#2B3767`. `adaptiveIcon.backgroundColor` and the splash background are `#2B3767`. In-app `brand/trm-mark*` is unchanged.
