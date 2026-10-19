# Physical QA checklist — Samsung Galaxy A23 (MyTel / MPT, VPN off)

Use this checklist before handing a build to wider QA. Phase 1 is **read-only**: Home → Jobs → Learn only. Do not test sign-in, apply, or profile (blocked by web D-022).

**Device:** Samsung Galaxy A23 (or equivalent mid-range Android 12+)

**Networks:** Run each section on **MyTel** and again on **MPT**, with **VPN disabled**.

**API:** Live production `https://www.refertrm.com` (no staging keys on device).

---

## 0. Install the build

### Option A — EAS preview APK (recommended for field QA)

Prerequisites (Ko Ko): EAS project `cae45fbe-c884-406f-929d-14468d7e3eeb` linked in `app.json`, Android credentials configured in Expo, no secrets committed to git.

```bash
# One-time: install CLI and log in (human operator)
npm install -g eas-cli
eas login

# From repo root, link if needed
eas build:configure

# Preview APK (installable on device; see eas.json preview profile)
eas build --platform android --profile preview

# When the build finishes, download the APK from the Expo dashboard or:
eas build:list --platform android --limit 1
# Install via USB or send the APK link to the device
adb install -r path/to/downloaded.apk
```

Do **not** run production store submission from this checklist. Internal Play Console track is Ko Ko’s step after APK smoke passes.

### Option B — USB dev client (engineers only)

```bash
npm ci
npx expo start --android
```

---

## 1. Cold start

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1.1 | Force-stop the app, disable airplane mode, open ReferTRM | Splash → Home within ~10s on slow networks; no crash |
| 1.2 | Observe Home hero job card | Loading skeleton, then a role **or** clear empty/error/slow state with **Try again** where applicable |
| 1.3 | Scroll Home | Learn / Game cards render; no red error overlay |

---

## 2. Home tab

| Step | Action | Pass criteria |
|------|--------|---------------|
| 2.1 | Tap **See all jobs** | Jobs tab opens with list or honest empty/error state |
| 2.2 | Tap **Learn** card | Learn tab opens |
| 2.3 | Background app 30s, return | Home still usable; hero may rotate after long background (>20s) |

---

## 3. Jobs list

| Step | Action | Pass criteria |
|------|--------|---------------|
| 3.1 | Open **Jobs** tab | **Connecting…** while loading; then rows or empty copy |
| 3.2 | Search a known keyword | List filters; empty search shows “No jobs match…” |
| 3.3 | Toggle **Yangon** / **Remote** chips | Filters apply without crash |
| 3.4 | Pull to refresh | Spinner; list updates or prior data stays with stale/offline banner |
| 3.5 | Open first job | Detail screen with title, company, location |

---

## 4. Job detail

| Step | Action | Pass criteria |
|------|--------|---------------|
| 4.1 | With network on, open a job | Description loads when API returns body |
| 4.2 | Back to Jobs, re-open same job | No crash; back navigation works |
| 4.3 | If banner shows “Saved content…” | Cached list/detail still readable |

---

## 5. Learn catalogue

| Step | Action | Pass criteria |
|------|--------|---------------|
| 5.1 | Open **Learn** tab | Lesson count line when API succeeded; module cards list |
| 5.2 | Search / category chips | Filters work |
| 5.3 | Open a lesson with **Myanmar available** | Detail opens |

---

## 6. Lesson reader — Myanmar typography

| Step | Action | Pass criteria |
|------|--------|---------------|
| 6.1 | Toggle **Myanmar** | Padauk faces; line height ~1.8; no tofu boxes |
| 6.2 | Toggle **English** | Returns to default Latin typography |
| 6.3 | Scroll full lesson | No crash mid-scroll |

---

## 7. Airplane mode and recovery

| Step | Action | Pass criteria |
|------|--------|---------------|
| 7.1 | With Jobs list loaded once, enable **airplane mode** | Banner: offline / saved content; cached jobs still visible |
| 7.2 | Open a previously viewed job | Header from cache; description shows offline copy or cached body |
| 7.3 | Tap **Try again** on an error screen | No crash when offline |
| 7.4 | Disable airplane mode | Pull refresh succeeds; banner clears when fresh data arrives |

Repeat 7.1–7.4 on **Learn** and one **lesson** that was opened online first.

---

## 8. Slow / flaky network (MyTel or MPT)

| Step | Action | Pass criteria |
|------|--------|---------------|
| 8.1 | Cold start on weak signal | Home hero may show “Still loading roles…” then recover or **Try again** |
| 8.2 | Jobs tab on weak signal | No indefinite blank screen; **Connecting…** or error + retry |
| 8.3 | Wait through a full list timeout (~20s) | App does not crash; user can retry |

---

## 9. Out of scope (do not file as P1 bugs)

- Sign-in, apply, payouts, profile editing (web D-022)
- Earn / Me native flows beyond shell
- GPS / location permission prompts (must not appear)

---

## 10. Sign-off

| Field | Value |
|-------|--------|
| Tester | |
| Date | |
| Network (MyTel / MPT) | |
| Build ID / EAS build URL | |
| Git commit SHA | |
| Blockers | |

---

## Ko Ko — release plumbing (not run by this doc)

- [ ] Confirm EAS project `cae45fbe-c884-406f-929d-14468d7e3eeb` linkage and Android signing in Expo
- [ ] Produce `preview` APK or AAB for testers
- [ ] Upload to Play Console **internal testing** track when APK smoke passes
- [ ] Keep signing credentials out of git
