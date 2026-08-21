# refertrm-mobile

Android client of live ReferTRM. Package id `com.refertrm.app`.

Phase 1 is **read-only**: jobs browse/search/filter, academy catalogue + `/learn/:slug` reader, offline cache, two-tab shell, `refertrm://` deep links. No apply, no profile, no sign-in.

This GitHub repo is the Expo source. EAS project id: `cae45fbe-c884-406f-929d-14468d7e3eeb`.

## Play Store

Not submitted from this lane. Launcher and adaptive icons now use **Direction 1 — Whole Mosaic**, approved by KoKo. The complete illustrated TRM is the production mark. See [assets/README.md](assets/README.md).

## Stack

Expo / React Native, Hermes, TypeScript. Public GETs only:

- `GET https://www.refertrm.com/api/jobs?status=active&limit=500`
- `GET https://www.refertrm.com/api/academy/public`
- `GET https://www.refertrm.com/api/academy/modules/:id`

No Supabase anon key in P1. HTTP client is shaped for Bearer after Codex lands D-022 in `25referTRM`. This repo does not implement D-022 and does not add parallel mobile API routes. [Issue #1](https://github.com/talentsolutionsmyanmar-max/refertrm-mobile/issues/1) and `docs/D-022-bearer-session.md` are reference mirrors only.

## Counts

Never hardcode. Render live `jobs.length` and `modules.length`.

## Run

```
npm test
npm run typecheck
npx expo start
```

Do not write to `25referTRM` from this repo.
