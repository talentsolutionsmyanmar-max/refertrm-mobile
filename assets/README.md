# Brand and Play assets

Canonical artwork for in-app header:

- `brand/trm-mark.png` / `@2x` / `@3x` — colour TRM mark (37×22 @1x). Height 22 is the floor; letters are tiny illustrations and smudge below that. No `tintColor`.

Background for launcher/play assets: `#2A3764`, sampled from the master illustration.

| File | Size | Notes |
| --- | --- | --- |
| `icon.png` | 1024×1024 RGB | Expo app icon, no alpha |
| `play/icon-512.png` | 512×512 RGB | Play Console high-res icon. No transparency. |
| `play/feature-graphic.png` | 1024×500 RGB | Play feature graphic from the same artwork |
| `adaptive-icon.png` | 1024×1024 RGBA | Expo adaptive foreground, complete mark in 66% safe zone |
| `play/adaptive-foreground-432.png` | 432×432 RGBA | Adaptive foreground |
| `play/adaptive-background-432.png` | 432×432 RGB | Solid `#2A3764` |
| `launcher/ic_launcher-*.png` | 48–192 RGB | mdpi–xxxhdpi, compact TRM mark |

## Launcher icon — approved compact mark

Ko Ko approved this compact mark on 20 Oct 2026: solid simplified TRM wordmark, bold flat letters `#74BDF2` on solid `#2A3764`, no illustrations inside the letters (DejaVu Sans Bold, rendered with Pillow). `icon.png` letters ~70% wide; adaptive foreground letters ~58% wide, inside the 66% safe zone. The original detailed artwork stays in `play/feature-graphic.png` and `brand/trm-mark*` (unchanged). The previous "launcher icon unresolved" release risk is closed.
