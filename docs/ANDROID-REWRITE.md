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
