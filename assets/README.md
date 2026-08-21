# Brand and Play assets

Canonical artwork (do not invent a mark, do not crop letters):

- `brand/logo-full.png` — 3073×1845 illustrated TRM logo + wordmark
- `brand/logo-original.png` — 3073×1845 illustrated TRM logo + wordmark

Navy sampled from that master: `#2A3764`.

The complete artwork is 2600×953. Square icons letterbox the full mark on navy. Nothing is cropped.

| File | Size | Notes |
| --- | --- | --- |
| `icon.png` | 1024×1024 RGB | Expo app icon, no alpha |
| `play/icon-512.png` | 512×512 RGB | Play Console high-res icon. No transparency. |
| `play/feature-graphic.png` | 1024×500 RGB | Play feature graphic from the same artwork |
| `adaptive-icon.png` | 1024×1024 RGBA | Expo adaptive foreground, complete mark in 66% safe zone |
| `play/adaptive-foreground-432.png` | 432×432 RGBA | Adaptive foreground |
| `play/adaptive-background-432.png` | 432×432 RGB | Solid `#2A3764` |
| `launcher/ic_launcher-*.png` | 48–192 RGB | mdpi–xxxhdpi |

## 48px launcher

mdpi 48×48 cannot carry the complete illustrated mark. At that size the wordmark collapses to a pale bar. hdpi 72×72 is the same. xhdpi 96×96 is barely a silhouette. A compact glyph was not invented. Use the 512 Play icon and the 1024 Expo icon as the readable store assets.
