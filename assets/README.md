# Brand and Play assets

Approved production set: **Direction 1 — Whole Mosaic** (KoKo).

The complete illustrated TRM is preserved. No letter is cropped. No compact glyph was invented. The retired compact mark is not restored.

## Source pack

| Artifact | SHA-256 |
| --- | --- |
| `ReferTRM-Whole-Mosaic-production-assets.zip` | `e67191aa86dd0a40784b6188a69c46dd27ade6140ab9963a77f6ff6060327e83` |
| `qa/Whole-Mosaic-production-proof.png` | `e0fa2b0809b72c92467c380df93c67e0d4cc1f91d4314b50a063ec4c0c80ff70` |

Pack README (byte-for-byte from the ZIP, not edited): [`source/whole-mosaic/README.md`](source/whole-mosaic/README.md).  
Proof sheet (byte-for-byte from the ZIP, not edited): [`qa/Whole-Mosaic-production-proof.png`](qa/Whole-Mosaic-production-proof.png).

Those two artifacts were created **before** this repository integration. The pack README line “No files have been committed to GitHub” is original pre-integration provenance. It is not a statement about this branch after the Whole Mosaic commit.

Canonical geometry from the pack:

- Background `#2A3764`
- Standard square icon: artwork width 68.4% of canvas
- Adaptive / maskable foreground: artwork width 58.6% of canvas
- Files copied byte-for-byte. Artwork was not regenerated.

## Expo public configuration

Managed Expo builds consume `app.json` plus the live files under `assets/icon.png`, `assets/adaptive-icon*.png`, and `assets/play/` / `assets/launcher/` as mapped below. **`app.json` and Expo prebuild generate the native Android/iOS resources used by managed builds.**

`app.json` resolves:

- `expo.icon` → `assets/icon.png` (1024×1024 opaque Whole Mosaic)
- `expo.splash.image` → `assets/icon.png`, splash background `#2A3764`
- `expo.android.adaptiveIcon.foregroundImage` → `assets/adaptive-icon.png`
- `expo.android.adaptiveIcon.backgroundImage` → `assets/adaptive-icon-background.png`
- `expo.android.adaptiveIcon.backgroundColor` → `#2A3764`
- `expo.android.adaptiveIcon.monochromeImage` → `assets/adaptive-icon-monochrome.png`
- Package `com.refertrm.app` and EAS project `cae45fbe-c884-406f-929d-14468d7e3eeb` unchanged

## Pack inventories (not native project folders)

`assets/android/**` and `assets/ios/AppIcon.appiconset/**` are **preserved source/reference inventories** from the approved production pack. They are **not** independently wired native project folders in this managed Expo repository. There is no top-level `android/` or `ios/` app project here; prebuild emits those from `app.json` and the Expo-mapped assets above.

## Live mapping (Expo / Android / iOS)

| Live path | Source in pack | W×H | Mode | Alpha |
| --- | --- | --- | --- | --- |
| `icon.png` | `android/icon-1024.png` (= iOS 1024) | 1024×1024 | RGBA | opaque (255,255); no transparent pixels |
| `adaptive-icon.png` | `android/adaptive-icon-foreground-1024.png` | 1024×1024 | RGBA | transparent foreground |
| `adaptive-icon-background.png` | `android/adaptive-icon-background-1024.png` | 1024×1024 | RGBA | opaque navy |
| `adaptive-icon-monochrome.png` | `android/adaptive-icon-monochrome-1024.png` | 1024×1024 | RGBA | transparent monochrome |
| `play/icon-512.png` | `android/play-store-icon-512.png` | 512×512 | RGBA | opaque (255,255); no transparent pixels |
| `play/adaptive-foreground-1024.png` | same as adaptive foreground | 1024×1024 | RGBA | transparent |
| `play/adaptive-background-1024.png` | same as adaptive background | 1024×1024 | RGBA | opaque |
| `launcher/ic_launcher-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}.png` | `android/mipmap-*/ic_launcher.png` | 48–192 | RGBA | opaque |
| `launcher/ic_launcher_round-*.png` | `android/mipmap-*/ic_launcher_round.png` | 48–192 | RGBA | transparent round mask |
| `android/**` | pack `android/` resource tree | — | — | reference inventory only; not a wired native folder |
| `ios/AppIcon.appiconset/` | pack iOS appiconset 20–1024 | 20–1024 | RGBA | reference inventory only; not a wired native folder |
| `brand/whole-mosaic-master-transparent-1024.png` | pack master | 1024×1024 | RGBA | transparent master |

Illustrated wordmark masters kept from the previous brand drop (not in this ZIP):

- `brand/logo-full.png` — 3073×1845 complete illustrated TRM
- `brand/logo-original.png` — 3073×1845 complete illustrated TRM

Play feature graphic `play/feature-graphic.png` (1024×500) is **not** in the Direction 1 ZIP. Left unchanged. Do not invent a replacement.

Temporary 432×432 adaptive files were removed.

## Output SHA-256 (live Expo files)

| File | SHA-256 |
| --- | --- |
| `icon.png` | `fe409adce5f7087ead3cc42d93f59bff8ca3bf4097d50bb547d12937283e34d8` |
| `adaptive-icon.png` | `dcd24fb7fdcff6a0593cf8a1b4af868e43c2b6e3298b99a812574da608182573` |
| `adaptive-icon-background.png` | `d17f4160120d0e67e835d7f087708b9b3717dc9cbfd6ea19a85a10c584b167a3` |
| `adaptive-icon-monochrome.png` | `1e63aa4ae349a53aab9bacbe69a08a3362f982600f3b514c99156a2ceec0bcb0` |
| `play/icon-512.png` | `ea98e51e32e9ddffe0f21e0552848fb9d9c6dbcb25b779a3a1997618568ea78a` |
| `brand/whole-mosaic-master-transparent-1024.png` | `11c13542fe106ad081aa52b5cfb5a2f7b8c9160a2b5b4eb4dc710f4817bb987b` |
| `qa/Whole-Mosaic-production-proof.png` | `e0fa2b0809b72c92467c380df93c67e0d4cc1f91d4314b50a063ec4c0c80ff70` |

## Web / PWA (not applied)

Inventoried only under [`source/web-pwa/`](source/web-pwa/). **Not written to `25referTRM`.** This mobile repo does not deploy them.

| File | SHA-256 | Notes |
| --- | --- | --- |
| `favicon-32.png` | `7bb93f270571f72515c90a3d80fb8872338c26badd3e226f59514f3160f98026` | 32×32 opaque |
| `favicon-48.png` | `6321885b8c60cab5ad4886aeb4a2e7908f351e1a0d2092a200d9952bbfa474cb` | 48×48 opaque |
| `favicon-192.png` | `2a107b741a86c963a7814249f2453e2985b60b181034c5bf534e8c51299ed2f0` | 192×192 opaque |
| `favicon-512.png` | `ea98e51e32e9ddffe0f21e0552848fb9d9c6dbcb25b779a3a1997618568ea78a` | 512×512 opaque |
| `apple-touch-icon-180.png` | `2a54eaa7f89ba7c6c3a6c5b83312ba665a490eabfc55e3274e950ffc4bfa6a33` | 180×180 opaque |
| `maskable-icon-192.png` | `512d0cbbd5654becc9759564b04d32c4f4517868752235e200e45057f8672eef` | 192×192 opaque maskable |
| `maskable-icon-512.png` | `a472a6c32c0fea2d491b9c10955b4c003e4d807b59799ddf71322b900e7ea193` | 512×512 opaque maskable |

## Release

Play submission remains blocked in this lane. No EAS build, APK, or store upload from this change.
