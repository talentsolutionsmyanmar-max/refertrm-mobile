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
| `launcher/ic_launcher-*.png` | 48–192 RGB | mdpi–xxxhdpi. Not production-ready. |

## Release risk — launcher icon (unresolved)

The full wordmark is unreadable at launcher size. Android displays the icon at ~48dp regardless of the xxxhdpi 192px file. Native pixel size does not fix real-device legibility.

- Do not invent a compact symbol.
- Do not restore a Z.
- Do not crop one letter from TRM.
- Do not call the launcher icon production-ready.

Phase 1 development may continue. Final Play submission stays blocked until KoKo supplies or approves a legitimate compact brand mark, or explicitly accepts this limitation.
