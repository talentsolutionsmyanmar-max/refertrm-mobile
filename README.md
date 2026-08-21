# refertrm-mobile

Android client of live ReferTRM. Package id `com.refertrm.app`.

Phase 1 is **read-only**: jobs browse/search/filter, academy catalogue + `/learn/:slug` reader, offline cache, two-tab shell, `refertrm://` deep links. No apply, no profile, no sign-in.

Public GETs only — no Supabase anon key in P1. HTTP client is shaped for Bearer after Codex D-022.

Never hardcode job or course counts. Render live length.

```
npx expo start
```

EAS organisation and Play brand assets are still owed. Do not write to `25referTRM` from this repo.
