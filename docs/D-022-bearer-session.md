# D-022 — Bearer session on existing API helpers

**Worker:** Codex  
**Repo:** `25referTRM` only  
**Priority:** blocks the **next** mobile phase (apply / profile). **Does not block Phase 1.**  
P1 is read-only public GETs. A native Bearer 401 is irrelevant until we ship apply.

**Not a new route.** Extend the existing helper so `/api/apply` and `/api/user/me` work from a native client.

This file is a reference copy in `refertrm-mobile`. Implementation belongs in `25referTRM`. Grok cannot write that repo (GitHub is scoped to this repo only).

## Why

`src/lib/api-auth.ts` `getAuthUserId()` reads Supabase session from **Next.js cookies only**.  
Expo will store the access token in Android Keystore (`expo-secure-store`) and send `Authorization: Bearer <access_token>`.

Live today:

- `POST /api/apply` → 401 `auth_required` from native
- `GET /api/apply` (my applications) → same
- `GET /api/user/me` → same
- Apply insert uses `createClient()` from `@/lib/supabase/server` (cookie SSR). Even if userId were parsed from Bearer, RLS insert would run as anon.
- Referrer is `req.cookies.get('refertrm_ref')` only.

Do **not** add `/api/mobile/apply`. Do **not** let the app insert into `job_applications` directly (bypasses rate limit, gear hooks, CV bank, duplicate check).

## Change

1. `getAuthUserId()`: if `Authorization: Bearer <jwt>` is present, `supabase.auth.getUser(jwt)` and return that user id. Else keep cookie path (web must not regress).
2. `/api/apply` POST: build the mutating Supabase client from that JWT (RLS as the candidate), not from empty cookies.
3. Accept referral from JSON `referralCode` **or** cookie `refertrm_ref`. Same `resolveReferrer` after that.
4. `/api/user/me` rides the helper change. No other behaviour change. It already uses service-role after auth; do not copy that pattern into apply.

## Implementation clarification (binding)

Do not make all 182 `getAuthUserId` consumers implicitly Bearer-capable through ambient `headers()`.

- Bearer handling must be request-scoped: callers explicitly pass `Request` / `NextRequest`.
- Cookie-only callers retain identical behavior.
- `POST /api/apply` must use the same Bearer JWT for its RLS mutation client.
- `GET /api/apply` must also use that JWT for its RLS read client.
- `/api/user/me` explicitly passes the request, verifies Bearer, then may retain its existing service-role lookup.
- Invalid Bearer must fail closed, never downgrade to cookies.
- JSON `referralCode` takes precedence over `refertrm_ref` cookie.
- Enumerate every `getAuthUserId` consumer and prove unchanged cookie behavior.

Authenticating Bearer globally while leaving downstream clients cookie-scoped creates inconsistent authenticated-as-anon behavior. That is a NO-GO.

## TEST

- Cookie session from www.refertrm.com: apply + `/api/user/me` unchanged.
- `POST /api/apply` with valid Bearer, **no cookies**, body `{ jobId, candidateName, phone, email }` → 200 `{ applicationId, status: "submitted" }` or 409 duplicate. Never 401.
- Same request, no Bearer, no cookies → 401 `auth_required`.
- `GET /api/user/me` with Bearer, no cookies → 200 profile.
- 6th apply in one hour → 429 `rate_limit`.
- Inactive job → 409 `JOB_INACTIVE`.
- `referralCode` in body attributes referrer when cookie absent. JSON wins over the cookie.
- Invalid Bearer, even with a valid cookie present → fail closed (401). Do not fall back to cookies.
- `candidate_id` on `job_applications` equals `auth.users.id` (UUID). `User.id` TEXT cast stays server-side.

## SUCCESS

Web apply still works. Native apply/profile can use the existing routes. No new endpoint. No service-role in the APK. Cookie-only callers of `getAuthUserId` are unchanged.
