# Native Android rewrite — status

The Kotlin + Jetpack Compose app in [`android/`](../android). This records what
is built, what is verified, and what is deliberately not done yet.

**571 tests, all green.** `cd android && ./gradlew test`

## What is done

| Phase | State |
|---|---|
| 0 Foundation | `android/` Gradle project, version catalog, module graph, CI |
| 1 Core port + parity gate | `:core:cipher` — engine, progression, merge, cursor, timer, solve |
| 2 Design system | Theme, 12 bundled faces, the 54-glyph cipher font, 31 press plates |
| 3 Board | Measured layout, typewriter, dock, hardware keys, predictive back |
| 4 Persistence | `:core:data` — DataStore desk, wallets, solves |
| 5 Cloud | `:core:cloud` — Firestore desk (**see the caveat below**) |
| 6 Screens | Desk, archive, case file, guide, bureau, leaderboard, article reader, solve bulletin |
| 7 Adaptive | Compact / Medium / Expanded, side rail, reading measure |
| 8 Release | Signing, R8, shrinker guard, Play publishing, CI |
| 9 Demolition | **Not done. Gated — see below.** |

## The parity gate

Cipher glyph assignment is recomputed on every device and never stored, so a
Kotlin implementation that diverges by one integer hands Android players a
different cipher for the same puzzle, with no error anywhere.

`scripts/emit-fixtures.mjs` generates twelve golden fixtures from the
TypeScript. `:core:cipher` asserts against them; `npm run emit:fixtures --
--check` fails the web job when they go stale. The two implementations cannot
drift silently.

Two divergences a Kotlin port hits by default, both invisible on inspection and
both caught by `lcg.json`:

- `hashSeed` truncates to int32, but `Math.abs(-2147483648)` widens to a double
  in JavaScript while Kotlin's `abs(Int.MIN_VALUE)` stays negative.
- `nextSeed` runs on JS doubles, so `233279 * 9301` never overflows. In Kotlin
  the whole LCG must be `Long`.

## What is not verified

**`FirestoreDesk` has no test.** Exercising it needs real credentials and a
device. What is tested is the contract around it, against fakes: a first sign-in
with an empty cloud, a fresh device pulling the desk down, two devices
disagreeing and keeping the work from both, and a wallet spent on either device
staying spent. Those drive `DeskActions.mergeCloud`, whose rules are
fixture-pinned against the web. **The reconciliation rules are verified; the
Firestore plumbing is not.**

**Nothing has run on a real device or emulator.** Every check here is JVM-side,
under Robolectric where a UI is involved. That covers layout, font scaling,
navigation and game rules, but not: IME behaviour on OEM keyboards, edge-to-edge
under gesture navigation, Google sign-in against a Play-signed build, or how the
merged glyph font looks next to Special Elite.

## Before Phase 9 (deleting `mobile/`)

`mobile/` is the Expo WebView shell. It is the only Android path that has ever
produced a shippable artifact, so deleting it trades a working fallback for
nothing until the native app has actually run. Do it after all of:

1. The native APK installs and plays through an edition on a real device.
2. Anonymous sign-in and one Firestore read/write succeed against the real
   project.
3. Google sign-in works on a **Play-signed** build — this is the only way to
   catch a certificate-hash mismatch, which fails on Play-signed builds alone.
4. A leaderboard read renders, and a posted time appears.

Then the deletion is: `mobile/`, `scripts/android-ship.mjs`,
`scripts/stage-web-assets.mjs`, `scripts/check-mobile-config.mjs`,
`scripts/android-smoke-test.mjs`, `.github/workflows/eas-android.yml`, the
`check:mobile` script and the `EXPO_TOKEN` secret. From `src/`:
`utils/androidApp.ts` and its call sites, the DOM half of `game/cipherCursor.ts`
(lines 1–30 and `webTypeFeel`), the hidden-input block and `visualViewport`
heuristic in `App.tsx`, `paper.css:339-357`, `board.css:279-303`,
`themeTokens.ts`, and `hooks/useOfflinePack.ts`.

## Host quirks

Gradle cannot start a daemon on this machine without a JVM flag. See
[`android/README.md`](../android/README.md) — it is not a network problem, and
the diagnosis is not obvious.

## Regenerating

```bash
npm run emit:fixtures        # parity fixtures from the TypeScript
node scripts/gen-palette.mjs # the 54 cipher glyphs
node scripts/gen-theme.mjs   # colours from src/styles/tokens.css
node scripts/gen-fonts.mjs   # woff2 -> ttf
node scripts/gen-woodcuts.mjs# press plates -> vector drawables
node scripts/gen-glyph-font.mjs  # the merged cipher font (needs .fontsrc)
```

Content is not generated: Gradle stages `src/data/*.json` into assets on every
build, so the web and Android read the same bytes.

## Web parity pass (cross-match at 411x891)

Each Android screen was compared against the web build running at the emulator's
own 411x891 viewport. What changed, and what deliberately did not:

**Closed, functional**

- The desk dock had three tools where the web has five. `Undo` and `Tally` did
  not exist on Android at all. Undo keeps a history of guess maps on
  `BoardState`; it does not rewind wallet spends, or a hint would be free. Tally
  is the glyph frequency sheet, filtered to repeats, busiest first, tappable to
  move the cursor.

**Closed, visual**

- Dock: five icon-and-label tools on the dark bar, wallet counts as badges.
- Board: bordered folio on `Modifier.scannedPaper`, word rules running under each
  word and through the gaps between its letters, tile borders.
- The Primer coach (`PrimerCoach.kt`), edition 0 only, as on the web.
- Archive: chapter headings, one collapsed line per edition with plate, lock and
  a dot per slot; one row expanded at a time.
- Board masthead capped at two lines; small caps labels on the typewriter face.

**Deliberately not matched**

- The web's top nav bar. Android keeps the bottom `NavigationBar`, which is the
  platform convention and was an explicit earlier decision.
- The web's in-board zoom controls. Tiles are measured from `sp` text, so the
  system font-size setting is the zoom control.

**Still unverified**

- `FirestoreDesk` and `FirebaseAccount` remain untested: they need real
  credentials and a Play-signed build.
- The release variant builds **unsigned** -- there is no keystore configured, so
  only the debug APK is installable. See the signing section of
  `app/build.gradle.kts`.

## Web-to-Android functionality audit

Every web feature checked against the Android build.

### Closed in this pass

| Gap | Was |
|---|---|
| Bureau Board | `Standings.rank(emptyList(), null)` -- a hardcoded empty list. Now `FirestoreLeaderboard`, reading and posting against the paths in `firestore.rules`. |
| Posting identity | No codename anywhere. Now a Bureau section; nothing posts until a name is chosen. |
| Cloud progress sync | `FirestoreDesk` had no factory and was never constructed. Now hydrated on sign-in and pushed debounced. |
| Account deletion | `deleteAccount()` existed with no caller. Now a confirmed action in the Bureau -- a Play requirement. |
| Anonymous auth | Never called. Now on launch, as the web does. |
| Sign-in errors | Raw `GetCredentialException` messages. Now translated. |

### Deliberately not ported

- Top nav bar, in-board zoom, offline pack, PWA install, edition-update banner --
  see the parity-pass section above and the plan's delete list.

### Closed in the follow-up pass

- **`starts/`, `solves/` and `puzzleStats/`** are written, and `LiveStatsRow`
  shows quickest/solvers/rate/average on solving. Both writes are transactions
  because the rules require the receipt document in the same write.
- **Crashlytics** is applied alongside the other Firebase plugins. No uid is
  attached to reports.
- **The share card is a real image.** `Clipping` draws a newspaper clipping on a
  Canvas and hands it to the share sheet through a FileProvider, rather than
  screenshotting the board.
- **The bottom bar is no longer Material's `NavigationBar`.** It is a newspaper
  section rail: five hand-drawn marks, typewriter caps, a cinnabar section rule
  on the open section, and an ink rule joining it to the page.
- **The app had no launcher icon at all** and was shipping the stock Android
  robot. It now has an adaptive icon built from the web's own mark, with a
  monochrome layer for themed icons, plus a launch theme and an entry splash
  that ports the web's masthead, turning plate and "Enter the edition" key.

### Open

- Nothing from the web feature list. The remaining risks are on the device and
  server side, below.

### Blocked: Firestore writes are refused

Every write under `users/{uid}` returns `PERMISSION_DENIED` for an anonymous
user -- the profile, the per-puzzle progress, and the wallets, each of which is
guarded by a *different* validator. Three different validators do not reject
valid data in the same way; the common factor is the `isOwner()` ->
`isAuthenticated()` gate that all three share. Public reads (`allow read: if
true`) work, which is why the leaderboard renders.

The payload was checked field by field against `isValidUser` in this repo's
`firestore.rules` and satisfies it. So either the deployed rules differ from
this file, or `isAuthenticated()` is deployed in a form that excludes anonymous
sign-ins. **Check the console's Rules tab against this file before assuming the
client is wrong**, and redeploy with `firebase deploy --only firestore:rules` if
they have drifted.

Sync failures are logged under the `ChronicleSync` tag rather than swallowed,
which is how this surfaced at all.
