# refertrm-mobile

Android client of live ReferTRM. Package id `com.refertrm.app`.

Phase 1 is **read-only**: jobs browse/search/filter, academy catalogue + `/learn/:slug` reader, offline cache, two-tab shell, `refertrm://` deep links. No apply, no profile, no sign-in.

This GitHub repo is the Expo source. EAS org and Play brand assets are still owed from KoKo.

## Stack

Expo / React Native, Hermes, TypeScript. Public GETs only:

- `GET https://www.refertrm.com/api/jobs?status=active&limit=500`
- `GET https://www.refertrm.com/api/academy/public`
- `GET https://www.refertrm.com/api/academy/modules/:id`

No Supabase anon key in P1. HTTP client is shaped for Bearer after Codex D-022.

## Counts

Never hardcode. Render live `jobs.length` and `modules.length`.

## Run

```
npx expo start
```

Play AAB: EAS once the Expo organisation exists.

Do not write to `25referTRM` from this repo.
