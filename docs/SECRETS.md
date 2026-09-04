# Secrets and environment

Every credential this project needs, where it is consumed, and how to get one.

Nothing here is committed. Locally these live in `.env` and `mobile/.env`, both
gitignored; in CI they are GitHub repository secrets. `scripts/env.mjs` loads the
two local files for plain Node scripts (Vite loads `.env` on its own).

## Quick start: I just want to build the Android app

1. Create an Expo access token: **expo.dev → Account Settings → Access tokens → Create**.
   Prefer a token on a **robot account** over a personal one — it survives staff changes
   and can be scoped to this project.
2. **For CI:** GitHub → repo **Settings → Secrets and variables → Actions → New
   repository secret**. Name it exactly `EXPO_TOKEN`. Then dispatch the *EAS Android*
   workflow; its first step verifies the secret and fails in seconds if it is missing.
3. **For local builds:** `cp mobile/.env.example mobile/.env`, paste the token after
   `EXPO_TOKEN=`, and run `npm run ship:android`.

`npx eas-cli login` also works locally instead of a token — `android-ship.mjs` accepts
either. CI has no interactive session, so there the token is the only option.

## Building an APK on your own machine

No `EXPO_TOKEN` needed here -- a login session satisfies the preflight just as well.
CI is the only place that requires the token, because it has no interactive session.

```
git fetch origin && git checkout claude/release-plan-phases-srwica
npm ci
cd mobile && npm ci && npx eas-cli login
npm run ship:android:test -- --skip-smoke
```

`ship:android:test` stops after the test APK and never touches Play; drop
`--skip-smoke` if you have an emulator running. The APK lands at
`mobile/.ship/test.apk`.

**You need a root `.env` first.** `scripts/stage-web-assets.mjs` refuses to build
without the Firebase values, and those live in GitHub secrets, not on your disk.
Copy `.env.example` to `.env` and fill in the same values the repository secrets
hold.

**One trap:** `.env.example` ships `VITE_FIREBASE_ENABLED="false"`, which is the
right default for web work but is rejected by the staging guard. It must read
`"true"` or the build stops with `VITE_FIREBASE_ENABLED must be "true"`.

The minimum the guard enforces is `VITE_FIREBASE_ENABLED=true` plus non-empty
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID`.
Fill in the rest anyway -- the app uses them at runtime, and a build that passes
the guard can still ship a half-configured app.

`VITE_MAX_EDITION` must stay **unset**. It is the Pages demo ceiling; leaking it
into an app build would ship three editions instead of thirty.

## Android build — `.github/workflows/eas-android.yml`, `mobile/.env`

| Secret | Consumed at | How to obtain |
|---|---|---|
| `EXPO_TOKEN` | `eas-android.yml:25,43` | expo.dev → Account Settings → Access tokens |
| `ADI_REGISTRATION_TOKEN` | `eas-android.yml:51` | Only for the `adi` profile, if Play Console asks for package ownership |
| `GOOGLE_SERVICES_CLIENT_JSON` | `mobile/app.config.js:9` | Firebase Console → Project settings → Android app → `google-services.json`, as a single-line string. Optional: a committed copy is used when unset |
| `EXPO_PUBLIC_WEB_URL` | `mobile/app.config.js:18` | Has a hard-coded default; override only to point the shell elsewhere |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `mobile/app.config.js:19` | Same — defaults to the real client id |

**Not yet wired, and it matters.** `eas-android.yml` carries none of the
`VITE_FIREBASE_*` values below. `scripts/stage-web-assets.mjs` deliberately refuses to
build without them, because otherwise a *paid* app ships with sign-in, the leaderboard
and cloud save silently missing while still passing the smoke test. Add them to that
workflow's environment before shipping a bundled Android build.

## Web deploy — `.github/workflows/deploy.yml`, `.env`

| Secret | Consumed at | How to obtain |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `deploy.yml:61` | Firebase Console → Project settings → General → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `deploy.yml:62` | same |
| `VITE_FIREBASE_PROJECT_ID` | `deploy.yml:63`, `configure-firebase.yml:22` | same |
| `VITE_FIREBASE_STORAGE_BUCKET` | `deploy.yml:64` | same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `deploy.yml:65` | same |
| `VITE_FIREBASE_APP_ID` | `deploy.yml:66` | same |
| `VITE_FIREBASE_DATABASE_URL` | `deploy.yml:67` | same |
| `VITE_FIREBASE_VAPID_KEY` | `deploy.yml:68` | Firebase Console → Cloud Messaging → Web Push certificates |
| `VITE_SENTRY_DSN` | `deploy.yml:69` | sentry.io → Project → Settings → Client Keys (DSN) |

`VITE_SENTRY_DSN` is **not set today.** While it is empty the reporter chunk is tree-shaken
away and production errors go to `console.error` and vanish — which leaves a staged
rollout with no signal to roll back on.

`VITE_FIREBASE_ENABLED` must be the literal string `true` for Firebase to initialise at all.

## Firestore config — `.github/workflows/configure-firebase.yml`

| Secret | Consumed at | How to obtain |
|---|---|---|
| `GOOGLE_SERVICES_JSON` | `configure-firebase.yml:21` | Firebase Console → Project settings → Service accounts → Generate new private key. JSON or base64 |

## Signing

Android signing keys are held by **EAS**, not this repo — `eas credentials -p android`.
`mobile/credentials.example.json` shows the shape only; its values are `SET_LOCALLY`
placeholders and no real keystore or password belongs in the repository.

## If a build fails on credentials

| Message | Cause |
|---|---|
| `An Expo user account is required to proceed` | `EXPO_TOKEN` unset in CI |
| `Refusing to build: no Expo credentials` | Local preflight: no token and no login session |
| `Refusing to stage the Android web bundle` | `VITE_FIREBASE_*` missing — see `scripts/stage-web-assets.mjs` |
| `mobile/app.json would fail expo prebuild` | Not a secret; run `npm run check:mobile` |
