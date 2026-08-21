# Brand and Play assets

Canonical artwork:

- `brand/logo-full.png` — 3073×1845 illustrated TRM logo + wordmark
- `brand/logo-original.png` — 3073×1845 illustrated TRM logo + wordmark

Background: `#2A3764`, sampled from that master.

The complete artwork is 2600×953. Square icons letterbox the full mark on navy. Letters are not cropped. No compact mark was invented.

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
- Do not restore a retired compact glyph.
- Do not crop one letter from TRM.
- Do not call the launcher icon production-ready.

Phase 1 development may continue. Final Play submission stays blocked until KoKo supplies or approves a legitimate compact brand mark, or explicitly accepts this limitation.
