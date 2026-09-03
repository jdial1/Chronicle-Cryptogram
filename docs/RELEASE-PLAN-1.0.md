# Chronicle Cryptogram — 1.0 Release Plan

## Context

Chronicle Cryptogram is a 1920s-newspaper cryptogram game: a React 19 + Vite PWA deployed to GitHub Pages, wrapped for Android by an Expo/React Native WebView shell (`mobile/`), backed by Firebase (anonymous + Google auth, Firestore progress/leaderboards, one scheduled FCM push). It has never shipped. The goal is a step ladder from the current state to a full (non-track-limited) Google Play production release.

**The codebase is in genuinely good shape.** Zero `TODO`/`FIXME`/`HACK` markers, zero `any`/`as any` across the whole TS surface, 16 `console.*` calls (all deliberate error logging), a 400-line `firestore.rules` with per-collection field allowlists, range validation, timestamp freshness checks, and cross-document receipt guards. Android permission hygiene is careful (2 requested, 25 explicitly blocked). A privacy policy exists and is specific. This plan is therefore not a cleanup effort — it is about closing a small number of real blockers in the right order.

**Three findings drive the shape of the plan:**

1. **Content cliff.** `src/data/puzzles.json` holds 61 puzzles (30 editions × Morning + Night) hard-dated `2026-08-16` → `2026-09-15`, gated by real wall-clock date. Today is 2026-09-03. After Sept 15 `currentMorningPuzzle()` returns `undefined`. There is no authoring pipeline and content is bundled in the binary, so every future edition would require a store release. **Decision taken: reframe 1.0 as a finite 30-edition season/campaign** — unlock by progression, not by calendar. Season 2 ships later.
2. **Store submission blockers.** Only 2 phone screenshots (Play requires 4), IARC content rating not filed, and Play App Signing SHA-1/256 not yet registered in Firebase — the last of which silently breaks native Google Sign-In on Play-signed builds only.
3. **No safety net.** No CI runs `npm test` or `npm run lint` despite both existing. No crash reporting anywhere — production failures go to `console.error` and vanish.

Competitive scan (below) says the differentiator to protect is that this game has **no ads, no coin economy, no subscription** — which is precisely what every negative review in the category is about.

---

## Market context

The category is crowded and, in 2025–26, newly consolidated: [Pixplicity's Cryptogram](https://play.google.com/store/apps/details?id=com.pixplicity.cryptogram) (3.5M downloads, 4.7★, 29k reviews) is the incumbent, with [Tripledot](https://play.google.com/store/apps/details?id=com.tripledot.cryptogram), [PlaySimple](https://play.google.com/store/apps/details?id=in.playsimple.cryptogram) and [iScool](https://play.google.com/store/apps/details?id=com.iscoolentertainment.cryptogram.word.puzzle) all having entered with ad-monetized clones.

**What the leader is praised for** — worth copying:
- No wrong-letter feedback until the board is full; you actually deduce. *Chronicle already does this; the 3-checks-per-day wallet is the right scarcity. Do not soften it.*
- Works fully offline. *Already true.*
- Tracks solved puzzles and lets you revisit them. *`ArchiveModal.tsx` covers this.*
- Google Play Games leaderboards. *Chronicle has its own Firestore leaderboard instead — see the integrity gap below.*
- **"Even after solving everything, more content comes along at a decent rate."** This is the single most-cited retention driver, and it is the one thing a finite campaign structurally cannot offer. See the risk note under Phase 2.

**Universal negative-review themes to avoid** — every one is monetization:
- Interstitial ads after every solve ("100 ads for 100 games"), full-screen video, missing exit buttons, crashes on ad load.
- Hints priced in coins; single-letter reveals gated behind watching an ad.
- "Remove ads" turning out to be a subscription with no one-time purchase.
- Store creatives that don't match actual gameplay.

**Positioning implication:** `mobile/store/listing.json` `developerPromotionalText` already says "free, ad-free". That should be the loudest line in the listing, not a footnote — it is the entire competitive wedge. The thin, real niche is narrative-through-puzzles (Murdle, Clues by Sam, Puzzmo), which is where the Vance case sits.

---

## Decisions taken

- **1.0 is a finite 30-edition season/campaign**, unlocked by progression rather than calendar date. Season 2 is a later release.
- **1.0 ships as a paid app** — one-time price, no ads, no IAP.
- **The listing promises a dated Season 2.** A cadence must be chosen before submission so the store copy can state it.
- **Screenshots:** `src/shot.tsx` gets extended with the missing scenes; capture and upload is manual.

### Concern on record: paid app

Two things follow from the paid decision that are worth naming once, then building around:

1. **The same game is already free on the open web.** `mobile/App.tsx` sets `WEB_URL = 'https://jdial1.github.io/Chronicle-Cryptogram/'` and `deploy.yml` publishes that site publicly on every push to `main`. The Android app is a WebView pointed at it. A paid Android app that wraps a free public URL is a weak value proposition *and* draws Play's "minimum functionality" scrutiny for webview wrappers. **This needs a resolution before submission — see Phase 2a.**
2. **Free → paid is not reversible** once an app is published free. The price must be set before the first production publish, which pulls the merchant-account setup forward into Phase 0.

Neither is a reason to reverse the decision; both are reasons to sequence it deliberately.

---

## Phase 0 — Stop the bleeding (prereq for everything)

No user-visible change. This is the safety net every later phase leans on.

- **Start the Google Play merchant account / payments profile now.** This is the longest-lead item in the entire plan — verification can take days and blocks setting a price, which in turn blocks the first production publish. Nothing else in Phase 0 depends on it, so start it and let it run in parallel.
- **Configure Play License Testing accounts.** Paid apps on internal/closed tracks require testers to either purchase or be on the license-test list. Without this, Phase 4's internal track cannot be tested by anyone but the account owner.
- **Change `developerPromotionalText`** in `mobile/store/listing.json` — it currently reads "OrangeTopGames makes **free**, ad-free puzzle games", which will be false.

- **Add a CI test gate.** `.github/workflows/deploy.yml` currently goes straight to `npm run build`. Add `npm run lint` (`tsc --noEmit && eslint src server.ts`) and `npm test` (`vitest run`) as gating steps *before* build, and add the same as a `pull_request` trigger. Six test files already exist and pass; nothing is being enforced.
- **Fix `eas-android.yml`.** It uses `--no-wait`, so a failed Android build still reports CI green. Drop `--no-wait` for the `production` profile at minimum.
- **Fix `npm run firebase:configure`.** `scripts/configure-firebase.mjs:5` imports `dotenv`, which is **not in `package.json`** (only in `bun.lock`). The `configure-firebase.yml` workflow does `npm install` then runs it → `ERR_MODULE_NOT_FOUND`. Either add the dep or — laziest, preferred — delete the import and read `.env` via `node:fs` + `process.env`, since Node 20 supports `--env-file`.
- **Untrack `mobile/.ship/test.apk`** (78 MB, tracked in git — the single largest file in the repo). Add `mobile/.ship/` to `.gitignore`. History rewrite is optional and can wait.
- **Wire crash reporting.** `src/utils/deskError.ts` already has `reportDesk()` as a one-line alias of `logDesk` — it is the pre-built hook point. Point it at one reporter (Sentry web SDK is the least-effort option that covers both the PWA and the WebView). Without this, Phase 4's staged rollout has no signal to roll back on.

**Verification:** open a PR against the branch and confirm the new lint/test job runs and can fail the build; run `npm run firebase:configure` locally to confirm it no longer throws.

---

## Phase 1 — Campaign reframe (the core change)

**The whole reframe in one sentence:** `editionNumber` (0–30) is *already* a total, bijective spine — verified against `puzzles.json`: every edition 1–30 has exactly one Morning and exactly one Night puzzle, and date ↔ editionNumber has no conflicts in either direction. `src/data/caseFiles.ts` is already keyed by `editionNumber`. `editionDate` is a redundant second key for the same axis. **Delete the second key, and replace `date <= today` with `editionNumber <= frontPage`.** Everything else falls out.

The one new primitive, in `src/utils/edition.ts`:

```ts
/** Highest edition the player may open: 1, or one past the last contiguously-solved morning. */
export function frontPageEdition(puzzles: PuzzleData[], solvedPuzzleIds: string[]): number
```

Walk `n = 1, 2, 3…` while morning `n` is solved; return the first `n` that isn't, clamped to the max edition. Edition 0 (the Primer) sits **outside** the walk — optional and always available, as `getInitialPuzzle()` already treats it. Contiguity rather than `Math.max` means a player with a hole can't skip it, and hand-edited localStorage is harmless.

### Implementation order

**Step 0 is the trick that makes this tractable:** delete `editionDate` from `PuzzleData` in `src/types.ts:22`, then run `npm run lint`. `tsc --noEmit` enumerates every load-bearing use as a compile error — that error list *is* the worklist. Leave the key in `puzzles.json` (zero diff, ignored at runtime, and useful authoring metadata for Season 2 scheduling).

1. **`src/utils/edition.ts`** — delete the wall-clock layer: `RELEASE_TZ`/`RELEASE_HOUR`/`RELEASE_MINUTE`, `todayIsoDate`, `publishedThroughDate`, `issueReleaseAt`, `nextIssueDate`, `formatIssueCountdown`, the private date helpers (`pad2`, `isoFromParts`, `chicagoParts`, `shiftIsoDate`), and `formatEditionDate`/`formatEditionDateShort`. Reshape `morningPuzzleOnDate` → `morningPuzzleForEdition`, `isNightUnlockedForDate` → `isNightUnlocked(puzzles, solved, edition)`, `groupPuzzlesByDate` → `groupIssues(puzzles): Issue[]` (which now returns **all 31 issues** and lets the UI render lock state, instead of filtering the future out). Add `editionLabel(n)`. `isHardPuzzle`, `puzzleMode`, `isNightEdition`, `articleDek`, `articleByline`, `ISSUE_CHAPTERS`, `chapterForEdition` are untouched.
2. **`src/game/puzzleState.ts`** — `getInitialPuzzle` already calls `readSolvedPuzzleIds()`; feed it into `currentMorningPuzzle`.
3. **`src/utils/localStore.ts`** — wallet key rename (see below). Mechanical.
4. **`src/utils/firebaseStore.ts`** — wallet doc IDs, drop the streak normalizer.
5. **`src/App.tsx`** — `handleSelectPuzzle` gains `if (puzzle.editionNumber > frontPage) return;`. `handleNextPuzzle` stops wrapping an index into a date-filtered array and becomes: Morning → Night of the same edition if unlocked; Night → Morning of `n+1` if unlocked; else close. Shorter *and* clearer than the current modulo wrap. Extract a `useCampaignProgress` hook here rather than growing the god-component further (see Structural note).
6. **`src/components/ArchiveModal.tsx`** — key rows by `editionNumber`, take `frontPageEdition` as a prop, delete `UpcomingIssueCard` and its 1-second `setInterval`, lock rows above the front page using the `<Lock>` treatment already written for Night Extra.
7. **`src/components/Header.tsx:230-233`** — the masthead currently prints **"Aug 17, 2026"** on a 1926 newspaper. Replace with `editionLabel(n)` + the chapter title `chapterForEdition(n)` already returns. More on-fiction than what ships today, and zero new data.
8. Streak deletion, dispatch deletion, `firestore.rules`, tests (below).

### Sub-decisions

**Hint/check wallets → per-edition, not per-calendar-day.** In a campaign a player can finish all 30 editions in one evening, so real-day keying would hand out 3 hints for the entire season and silently break the economy. Per-edition is a **rename, not a redesign** — the current `editionDate` key is already 1:1 with the edition, so player-facing behaviour is byte-identical. `DailyHintWallet.editionDate: string` → `edition: number`; `isEditionDate` → `isEditionKey`; Firestore doc IDs become `dailyHints/{n}`; the `firestore.rules` validator swaps its date regex for `^[0-9]{1,3}$`. Leave the ~20 `daily*` identifier names alone — renaming them is churn with no behaviour change and would drag a Firestore collection migration along.

**Streak → delete.** It is already a fake stat: `useSolveCelebration.ts:96-97` only ever *increments* it, nothing decrements or resets, and it defaults to `1`. In a campaign it is also tautological — solving in order is the only way to advance, so `currentStreak === puzzlesSolved` by construction. Two BureauDesk tiles showing the same number. Replace them for free with a real campaign stat from data already present: **"Editions decoded — {puzzlesSolved} / 30"**. Keep the rest of `GameStats` (`fastestTime`, `totalTimePlayed`, `leaderboardSubmissions` are all real).

**Morning Dispatch → cut for 1.0.** The known 8:00 ET / 08:30 CT mismatch is the wrong thing to notice. The real problem is that the payload — *"Today's case file is ready"* — becomes **false** the moment editions stop appearing on a schedule: the next edition has either been sitting unlocked for weeks, or is gated behind a puzzle the player hasn't solved. A daily unconditional broadcast is now spam. Making it progress-aware means per-user reads and new dispatch state in a scheduled fan-out — a new feature, not 1.0. Cutting it deletes the project's **only Cloud Functions deployment** (and its Blaze/Cloud Scheduler dependency) plus **two Android native modules** (`@notifee/react-native`, `@react-native-firebase/messaging`) — a real reduction in build surface and permission scope for a first submission. `POST_NOTIFICATIONS` can come out of `mobile/app.json` with it. Restore from git for Season 2, where "Season 2 is on the stands" is a push a campaign actually earns.

**Migration → none.** The new gate reads *only* `solvedPuzzleIds`, keyed by puzzle id (`day_7_easy`) — a key shape that does not change. Existing progress transparently produces the correct front page on first launch; that is the entire migration. Orphaned date-keyed wallet entries are silently skipped by the existing validator path in `readAllLocalDailyWallets`. Do not write a migration function or a schema version. The app is unreleased.

**New thing this phase needs: a terminal state.** Under date gating there was always a tomorrow. Under progression gating, solving edition 30's Night Extra ends the season and currently drops the player into a dead archive with nothing highlighted. Minimum viable: one conditional in `TodayStatsBulletin` swapping the CTA for a season-finale card pointing at the case files. ~10 lines, no new component. Budget a copy pass on the "Today's edition" / "daily" strings in `TodayStatsBulletin.tsx` and `HowToPlayModal` at the same time.

### Tests — extend `edition.test.ts`, do not add jsdom

All new gating is pure functions over `(puzzles, solvedPuzzleIds)`, which the existing `environment: 'node'` + `include: ['src/**/*.test.ts']` setup already covers. jsdom would buy the ability to assert that `ArchiveModal` renders a padlock when `editionNumber > frontPage` — a one-expression prop. Not worth a devDependency and a config change for a `<=`.

Add: `frontPageEdition` with no solves → 1; **primer-only solved → 1** (proves edition 0 doesn't gate); 1,2,3 solved → 4; **hole case 1,2,4 solved → 3** (contiguity, not max); all 30 → 30 (clamp, never 31); night-only solves don't advance. Plus `currentMorningPuzzle` never returns a Night/Primer/Practice puzzle, `isNightUnlocked` is unaffected by edition `n-1`, and `groupIssues` returns all 31 issues regardless of solve state.

**One test earns its place beyond this phase:** import `INITIAL_PUZZLES` and assert every `editionNumber` 1–30 has exactly one Morning and one Night puzzle. That makes the season contract enforceable at authoring time for Season 2. (Verified true today.)

Note what you stop writing: no `Date` mocking, no timezone-boundary tests, no 08:30-CT-vs-DST tests. Removing `todayIsoDate` removes the only nondeterminism in the module.

### Phase 1 cut list

Ranked, biggest first:

- `delete:` **Morning Dispatch, entire vertical** — `functions/src/index.ts` (71) + `useDailyNotification.ts` (226) + `mobile/dispatch.ts` (104) + mobile bridge + BureauDesk panel + firebaseStore token fns + rules. **≈ -570**
- `delete:` **The catch-up branch is now unreachable.** `offerStoryCatchUp = (isPrimer||isPractice) && storyHasBegun(...) && !hasSolvedStoryPuzzle(...)` is *provably always false* under progression gating: `storyHasBegun` requires a solved story puzzle, which makes `hasSolvedStoryPuzzle` true. A campaign's new player **starts** at Day 1, so there is nothing to catch up to. Deletes `storyHasBegun`, `hasSolvedStoryPuzzle`, `firstCasePuzzle`, `handleOpenDayOne`, the `onOpenDayOne` prop chain, and `PrimerPathButtons`' `offerCatchUp` arm. **≈ -70**
- `delete:` **All wall-clock machinery** — three timezone-aware helpers with one caller each, existing solely to answer "is it 08:30 in Chicago yet". **≈ -170**
- `delete:` **Streak.** **≈ -25**
- `yagni:` **No `fictionDate` field.** The 1926 dates already live as free text inside `authorOrSource` on 31 records and are already rendered by `articleByline()`. Adding a field means 61 rows of hand data-entry to duplicate text that is already on the page. *Avoids ~+70.*
- `yagni:` **No migration** (*avoids ~+60*), **no jsdom** (*avoids ~+40 and a devDependency*).

**net: ≈ -850 lines**, plus one Cloud Functions deployment, Cloud Scheduler, and two Android native modules gone.

---

## Phase 2a — Web becomes the demo

Resolves the paid-app conflict: the public web build stops being a free substitute for the paid app and becomes its funnel.

**The gate is free.** Phase 1 replaces date gating with `frontPageEdition(puzzles, solvedPuzzleIds)` clamped to the max edition. The demo is the *same clamp with a smaller ceiling* — a build-time constant, not a new mechanism:

- Add `VITE_MAX_EDITION` (default: unlimited). `deploy.yml` sets it to `3` for the Pages build.
- `frontPageEdition` already clamps; clamp to `min(maxEdition(puzzles), VITE_MAX_EDITION)`.
- `ArchiveModal` already renders locked rows after Phase 1 — editions 4–30 simply show as locked.
- Replace the season-finale card's target with a "continue on Android" call to action when the ceiling is the demo ceiling rather than the season end. The terminal-state component from Phase 1 is reused; only the copy branches.

Roughly a day, and it reuses Phase 1's work rather than adding a parallel mechanism.

**Honest limitation:** this gate is client-side and therefore soft. `src/utils/androidApp.ts` detects the shell via `ReactNativeWebView` / `?source=android`, all of which a curious player can spoof, and the full `puzzles.json` would still be in the Pages bundle unless the demo build strips it. **Strip the content at build time, not just the gate** — filter `puzzles.json` to editions 0–3 in the demo build so the withheld editions are genuinely absent rather than merely hidden. That turns a soft gate into a real one for the same effort, and it also shrinks the demo bundle.

**Recommended hardening, worth costing before you commit to paid:** have the Android app **bundle the built web app as local assets** instead of loading the remote URL. It is the largest single change in this plan, but it is the only thing that fully resolves all three of: the paid-wrapper policy concern, the offline cold-start failure ("The wire is down" on a first launch with no network — which Play's pre-launch report devices can trigger), and content leakage. Under the demo split above, the web and Android builds already diverge, so most of the build plumbing is shared. If the paid decision is firm, this is where the remaining risk lives.

---

## Phase 2b — Season 2 commitment

The listing promises a dated Season 2, so the date has to be real before submission.

- **Pick the cadence and write it into the listing.** This is the answer to the retention gap a finite campaign creates (see Market context) — it converts "the game ends" into "the serial continues".
- **The Phase 1 season-contract test** (every edition 1–30 has exactly one Morning and one Night) is what makes Season 2 authoring safe. Extend it to whatever the Season 2 range is.
- **Content authoring is the long pole, not the code.** 30 editions × 2 ciphers plus case-file fragments is the same volume as the entire existing game. Scope the authoring calendar before naming a date publicly; a missed dated promise on a paid app is worse than no promise.
- Season 2 is also where the Morning Dispatch push earns its way back (Phase 1 cuts it) — "Season 2 is on the stands" is an honest notification in a way "today's case file is ready" is not.

---

## Phase 2 — Integrity, compliance, and listing truth

### Leaderboard integrity
Puzzle answers ship in the client bundle (`originalText` in `puzzles.json`), and `recordPuzzleSolve` / `submitLeaderboardEntry` in `src/utils/firebaseStore.ts` write `timeSeconds`, `accuracy` and `hintsUsed` straight from the client. The only defense is a rules-level range check (`inRange(data.timeSeconds, 5, 86400)`). Any anonymous user can post a 5-second solve.

There is also a **stat-inflation loop**: `starts`/`solves` receipts allow `delete: if isAuthenticated() && resource.data.uid == request.auth.uid`, while `isValidSolveIncrement` only requires `!exists(solvePath) && existsAfter(solvePath)` — so a client can delete its own receipt and re-run the increment to pump `completeCount` and `totalTimeSeconds` indefinitely.

Recommended (ponytail: the laziest defensible fix, no server added):
- Make `starts`/`solves` receipts **non-deletable** (`allow delete: if false`) in `firestore.rules`. This closes the inflation loop with a one-line change; the account-deletion path in `firebaseStore.ts:483` needs a matching carve-out or the receipts get left behind by design (acceptable — they carry no PII).
- Leave client-asserted times as-is for 1.0 and **frame the leaderboard honestly in the UI** ("posted times", not "verified"). A server-authoritative timer is a real project and does not belong in 1.0 for a game with no monetary stake.

### Account deletion (Play blocker)
`BureauDeskModal.tsx` → `App.tsx:1169` → `firebaseStore.ts:483` deletes all Firestore documents, then signs out — but **never calls `deleteUser()`**, so the Firebase Auth account survives. Play's requirement is deletion of the *account*, not just the data. Two gaps:
- Add `deleteUser()` to the flow.
- The control only renders when `identified && user` — **anonymous players have no deletion affordance at all**, and everyone is auto-signed-in anonymously.
- Play also asks for a **web-accessible deletion URL** separately from the in-app flow. `public/privacy.html` describes in-app deletion but there is no such URL; add a section with an anchor and register it in Play Console.

### In-app privacy link
The only `href` in all of `src/` is a skip-link (`App.tsx:854`). Play expects an in-app link to the privacy policy for data-collecting apps. Add one to `BureauDeskModal.tsx` pointing at `/privacy.html`.

### Terms of Service
None exists anywhere. Not strictly required by Play, but with a public leaderboard carrying free-text codenames it is worth having.

### UGC on a public leaderboard
`LeaderboardModal.tsx:272` takes a free-text codename (`maxLength={20}`) written to a world-readable collection, while `listing.json` `contentRating` notes claim no UGC. Either add a wordlist filter and a report path, or — laziest — **answer the IARC questionnaire truthfully as containing user-generated content**. Filing "Everyone" on a false premise is the kind of thing that gets an app pulled post-launch. `listing.json` already warns: *"do not file Everyone until the questionnaire returns a rating."*

### Store listing rewrite
`mobile/store/fullDescription.txt` currently sells the *synchronous daily* model — "A new Morning Edition lands for everyone at once", "the same edition every codebreaker in the city is working", "don't give tomorrow's headlines away" — which is exactly what Phase 1 removes. It already says "This is a thirty-day serial" and "By day thirty", so the campaign framing is half-written. Rewrite to match shipped behaviour; `shortDescription` ("keep your streak") needs the same treatment. Lead with ad-free.

Also remove the "keep your streak" line — Phase 1 deletes the streak — and the "don't give tomorrow's headlines away" spoiler framing, which only makes sense when everyone plays the same edition on the same day.

**Positioning for a paid app.** The wedge is unchanged and, if anything, sharper: every negative-review theme in this category is monetization, and this game has **no ads, no coin economy, no subscription**. Lead with *pay once, own it* — that is the direct answer to the most common complaint in the category ("ad-free turns out to be a subscription"). `developerPromotionalText` needs rewriting either way since it currently claims "free".

Note: the full description is **duplicated verbatim** in `listing.json` and `fullDescription.txt`. Pick one source of truth (`ponytail delete:`).

**Retention risk to state plainly:** a finite campaign removes the incumbent's most-praised retention property. The mitigation is a committed Season 2 cadence, not a 1.0 feature — decide the cadence before launch so the listing can promise it.

---

## Phase 3 — Android build & submission mechanics

- **Register Play App Signing SHA-1/SHA-256 in Firebase** after the first AAB upload. `mobile/store/listing.json` flags this itself (`afterFirstEasBuild`). Play re-signs with a different certificate than the upload key, so **native Google Sign-In works in `preview`/`test` APKs and fails only on Play-signed builds** — the worst possible failure mode to discover in production.
- **Two more phone screenshots** (Play minimum is 4; only `phone-grid.jpg` and `phone-bulletin.jpg` exist, both 1080×1920). `src/shot.tsx` + `shot.html` is already a purpose-built harness that renders a fake mid-solve board and is excluded from the SW precache. **Extend it with the missing scenes** — case file, Night Extra, solve bulletin — then capture and upload manually. Tablet screenshots are optional, but the app declares itself tablet-capable (`resizeableActivity="true"`), so the listing will show "not optimized for tablets" without them.
- **File the IARC questionnaire** (see UGC note above).
- **Pin `targetSdkVersion`** via `expo-build-properties`. Nothing pins it today; the build inherits the Expo SDK 57 default. Pinning makes Play's target-API deadlines a deliberate decision rather than a side effect of an SDK bump.
- **Review `mobile/plugins/with-android-edge-to-edge.js`.** It patches React Native's `WindowUtil.kt` in place with exact-string `replaceOnce` and *throws* on mismatch, and forces a from-source RN build (slow, fragile across RN upgrades). It works today. Before 1.0, confirm whether Expo SDK 57 / RN 0.86 still needs it, or whether `react-native-edge-to-edge` / the built-in Expo edge-to-edge support now covers it — this is the highest-value `delete:` in the repo if it can go.
- Clean up the duplicate `com.chroniclecryptogram.app` Android client in `google-services.json` (it is the iOS bundle id registered as an Android app, sharing the same cert hash — harmless, confusing).
- Note: `scripts/ensure-emulator.mjs` and `scripts/project-paths.mjs` hardcode Windows SDK paths (`C:\Users\justin.dial\...`). The Android smoke suite is developer-machine-only and will never run in CI. Acceptable for 1.0; just know the smoke test is manual.

---

## Phase 4 — Staged rollout to production

`mobile/eas.json` already defines `submit` profiles for `internal`, `alpha`, and `ea`, and `scripts/android-ship.mjs` already chains build → smoke → gate → production AAB → submit to all three. The ladder is built; it just needs to be walked.

1. **Internal testing** — the `internal` track. Requires the Phase 0 license-test accounts, since paid apps are not free to testers by default. Verify on a real Play-signed build: Google Sign-In (the SHA gap above), the purchase flow itself, offline pack, edge-to-edge on Android 15/16, back gesture. (No FCM to verify — Phase 1 cuts it.)
2. **Closed testing (`alpha`)** — enough real testers to generate a Play pre-launch report. Watch for the cold-start-with-no-network case: the shell has no bundled assets, so a first launch offline shows "The wire is down". Play's pre-launch devices run in constrained network environments.
3. **Open testing / production at staged rollout** — start at a low percentage. Phase 0's crash reporting is what makes a rollback decision possible.

---

## Files that matter

| Area | Files |
|---|---|
| Gating logic | `src/utils/edition.ts`, `src/utils/edition.test.ts`, `src/game/puzzleState.ts` |
| Game shell | `src/App.tsx` (1191 lines — see structural note) |
| Persistence | `src/utils/localStore.ts`, `src/utils/firebaseStore.ts`, `firestore.rules` |
| Push | `functions/src/index.ts`, `src/hooks/useDailyNotification.ts`, `mobile/dispatch.ts` |
| Store | `mobile/store/listing.json`, `mobile/store/fullDescription.txt`, `public/privacy.html` |
| Build/CI | `.github/workflows/deploy.yml`, `.github/workflows/eas-android.yml`, `mobile/eas.json`, `scripts/android-ship.mjs` |

---

## Structural note (thermo-nuclear lens)

`src/App.tsx` is **1191 lines with ~40 `useState` hooks in a single component**, roughly 15 of which are independent modal-open booleans. Under the thermo-nuclear standard this is a presumptive blocker: any change lands in the same god-component and every reader must hold the whole thing in their head.

The honest call: **do not refactor it as part of 1.0.** It works, it is typed, and a 1191-line rewrite immediately before a first release is how you ship regressions. But Phase 1 touches puzzle selection, next-puzzle, and wallet flow — all of which live in this file — so extract *only what Phase 1 forces you to touch*, specifically a `useCampaignProgress` hook alongside the existing `useCloudDesk`/`usePuzzleSession` hooks. The modal-boolean collapse (15 booleans → one `activeSheet` discriminated union, which `useSheetStack.ts` is already halfway toward) is the obvious follow-up and belongs in the 1.0.1 window, not before launch.

## Dead weight (ponytail audit)

Ranked, biggest cut first. All are safe, independent, and can land in Phase 0:

- `delete:` `mobile/.ship/test.apk` — 78 MB tracked binary. Nothing replaces it; add `mobile/.ship/` to `.gitignore`.
- `delete:` `src/data/vance-case-file.txt` — 45 KB, referenced by **nothing** in `src`, `mobile`, `scripts`, or `vite.config.ts`. Appears to be authoring source material. Move it out of `src/` or drop it.
- `delete:` `motion` (`^12.23.24`) in `package.json` dependencies — imported nowhere. (`canvas-confetti` *is* used, via dynamic import in `useSolveCelebration.ts` and `useOfflinePack.ts` — keep it.)
- `delete:` `vite` is listed in **both** `dependencies` and `devDependencies`. Keep the devDependency.
- `delete:` duplicated full description in `listing.json` and `fullDescription.txt` — identical byte-for-byte. One source of truth.
- `yagni:` `server.ts` (69 lines) + `express` + the `esbuild` server bundling step in `npm run build`. Production deploys to **GitHub Pages** (`base: './'` in `vite.config.ts`, `deploy.yml`); the Express server exists only for local dev and a `/api/health` route nothing calls. Its one unique behaviour is rewriting `/splash*` → `index.html`, which `vite.config.ts` can do in a few lines alongside the existing `editionVersionPlugin()`. Cutting this removes a dependency, a build step, and a whole production path that is never exercised. *This is the biggest structural `delete:` available.*

---

## Verification

- **Phase 0:** PR triggers the new lint/test job; deliberately break a test and confirm CI goes red. `npm run firebase:configure` runs without `ERR_MODULE_NOT_FOUND`. Confirm a thrown error reaches the crash reporter dashboard.
- **Phase 1:** `npm test` — new `edition.test.ts` cases for progression gating. Manual: clear all storage, confirm a fresh player lands on edition 1 regardless of system date; set the device clock to 2027 and confirm nothing breaks (this is the regression the whole phase exists to prevent).
- **Phase 2a:** build the demo with `VITE_MAX_EDITION=3` and confirm editions 4–30 are locked in the archive **and absent from the bundle** — grep the built assets for an edition-7 quote string; a hit means the content strip didn't work and only the gate did.
- **Phase 2:** Firestore rules — attempt a receipt delete and confirm denial. Run the account-deletion flow as both an anonymous and a signed-in user; confirm in Firebase console that the Auth user is gone, not just the documents.
- **Phase 3:** Install the Play-signed internal-track build on a real device and sign in with Google — this is the only way to catch the SHA gap.
- **Phase 4:** Pre-launch report clean; crash-free rate holds through the staged percentages before widening.
