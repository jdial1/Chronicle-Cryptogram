# Chronicle Cryptogram: MVP 1.0

The checkpoint. What 1.0 is, what is already true, and the short list between here and a
production release on Google Play. Written 23 September 2026, on
`palette/board-announcements`.

This supersedes the step ladder in [RELEASE-PLAN-1.0.md](RELEASE-PLAN-1.0.md), which was
written for the Expo WebView shell. That shell is deleted (commit `30ec457`), so much of
that plan is moot. Its market analysis and its reasoning for the paid, finite season
still stand, and are not repeated here.

---

## What 1.0 is

**One sentence:** a paid, offline Android app with one finished 30-edition season of the
Vance case, where every decoded line is written into the case file, and a free 3-edition
demo on the web.

| Decision | Setting | Where it lives |
| --- | --- | --- |
| Soul | Casebook: "Nothing goes in the file until you can prove it." | [SOUL.md](SOUL.md) |
| Player | An agent of the Bureau | [VOICE.md](VOICE.md) |
| Android app | Native Kotlin and Compose, `com.chroniclecryptogram`, 1.0.0 | `android/` |
| Price model | Paid once. No ads, no in-app purchases, no hints for sale. | RELEASE-PLAN "Decisions taken" |
| Cloud | Off: no sign-in, no leaderboard, no live counts, no sync. The app ships offline. | `android/gradle.properties` `chronicleCloud=false` |
| Content | Primer, plus 30 editions × Morning and Night Extra, opened by progress | `src/data/puzzles.json` |
| Web | A 3-edition demo that links to the Play listing | `deploy.yml` `VITE_MAX_EDITION: "3"` |
| Season 2 | Promised in the listing; its own editions 1–30 | Not yet written |

**Out of 1.0, on purpose:** sign-in and cloud sync, both leaderboards, live solver counts
on Android, chapter-end findings (Season 2), confirmation-free Primer tells, a web
leaderboard. None of these is needed for the soul to hold, and each adds a surface to
verify. The cloud code stays in the tree behind the flag.

---

## Where it stands

**The game is done enough to ship.** All five soul litmus rows pass (re-run against the
library on 23 September; see SOUL.md). The season is complete, fair-play and frame
audits are tests, and the voice rule is pinned on both surfaces.

**Verified by tests on every change:**

- Web: lint, typecheck, 176 tests, and the Kotlin parity fixtures, in `deploy.yml` on
  pull requests and main.
- Android: `gradlew test` (the JVM suite and TS↔Kotlin parity), lint for debug and
  release with warnings as errors, and release APK/AAB builds, in `android.yml`.
- Content: every Night Extra splits, frames don't print their answers, last-word
  ambiguity is reviewed, and the season contract holds (`season.test.ts`,
  `frames.test.ts`, `fairPlay.test.ts`).

**Not verified anywhere yet:** the native app on a real phone. Everything in
ANDROID-REWRITE.md is proven on the JVM only.

A signed 1.0.0 bundle (versionCode 3) has been built. Whether it was uploaded to Play is
not recorded. If it was, the next upload needs versionCode 4.

---

## Definition of done

1.0 ships when all of these are true:

1. A signed AAB is live on the production track at the chosen price.
2. It has been played start to finish (Primer to edition 30's Night Extra) on at least
   two physical phones, one of them a non-Pixel OEM keyboard, with no blocker.
3. It cold-starts and plays in airplane mode.
4. The store listing, screenshots, Data safety form, and content rating describe the app
   that ships: offline, paid, no accounts, no user content.
5. The web demo's link points at the live listing.
6. Season 2 has a written budget (see "The one cost to plan now").

---

## The path

Four tracks. A and B can run at the same time; C is quick; D waits on A and B.

### A. Play Console (blocked on you, longest lead)

| # | Task | Notes |
| --- | --- | --- |
| A1 | **Merchant account and price.** | Verification can take days. Free to paid can't be undone, so set the price before the first production publish. |
| A2 | **Check your testing requirement.** | Personal developer accounts created after November 2023 must run a closed test (currently 12 testers for 14 days) before production access. If that applies, it sets the calendar, so start it early. *(Verify against your account type.)* |
| A3 | **License testers.** | Paid apps aren't free to testers without them. |
| A4 | **Content rating (IARC).** | With cloud off, there is no user-generated content in 1.0: no codenames, no board. Answer for the build that ships, not the old plan. |
| A5 | **Data safety form.** | Offline, no accounts, no analytics. The release manifest requests only VIBRATE, and crash data comes from Play's own Android Vitals. |
| A6 | **Privacy policy URL.** | Point it at the public `privacy.html` on the Pages site. Check that its text matches an offline app. |
| A7 | **Listing copy.** | Lead with "paid once, no ads, no in-app purchases." Say offline, 30 editions plus a Primer, and that Season 2 is coming. Never say streak, daily, or "today's case": the game has none of them. |
| A8 | **Screenshots: four phone captures from the native app.** | The two on file are web captures. Show the board, the case file with a quoted line, the solve bulletin ("Clean"), and a Night Extra. Tablet captures are optional; without them the listing shows "not optimized for tablets." |

### B. Real-device verification (blocked on hardware)

Play the full season on two phones and record each result in ANDROID-REWRITE.md:

- **Typing:** the IME on an OEM keyboard (Samsung or similar) and the in-app typewriter
  keys; every glyph copy fills; backspace, undo, and wipe.
- **Layout:** edge-to-edge with gesture navigation, landscape, and system font scaling
  at its largest.
- **Glyphs:** the cipher font renders every glyph in the palette, including the reversed
  letters.
- **Offline:** cold start in airplane mode.
- **TalkBack:** board announcements and the Primer's "Spotted" in words.
- **Share:** the clipping image shows the headline and receipt, never the decoded line.
- **The whole season:** Primer to edition 30's Night Extra, including the season-closed
  bulletin.

Anything found here is fixed before C4. Google sign-in on a Play-signed build is
**not** on this list; it waits for cloud.

### C. Repo hygiene (small, do now)

| # | Task | Why |
| --- | --- | --- |
| C1 | Commit this checkpoint. | The soul pass, the fixes, and these docs are uncommitted. |
| C2 | Mark stale docs. Rewrite ANDROID-BUILD.md and SECRETS.md for Gradle signing, and add a pointer to this file at the top of RELEASE-PLAN-1.0.md. | They describe Expo/EAS (`EXPO_TOKEN`, EAS-held signing), which no longer exist. ANDROID-REWRITE.md still says Phase 9 is pending and the release build unsigned. |
| C3 | Delete what's left of `mobile/`, or write down why it stays. | Five files survive from the deleted Expo shell. |
| C4 | Web demo: stop the console's Firestore `permission-denied` on progress and hint saves. Deploy the current `firestore.rules` and `firestore.indexes.json`, or turn cloud saves off in the demo. | It's the first thing a curious reviewer opens, and the demo shouldn't log failures. The new rules also carry the help-first leaderboard, harmless while no board posts. |
| C5 | Bump `chronicleVersionCode` if code 3 was ever uploaded. | Play rejects a reused code. |

### D. Release ladder

1. **Internal testing:** upload the signed AAB, install from Play, and repeat B's smoke
   pass on the Play-signed build.
2. **Closed testing:** licence testers, plus the closed test from A2 if it applies. Watch
   Android Vitals for crashes and ANRs.
3. **Production:** a staged rollout (a small share first, then all), watching Vitals and
   reviews at each step.
4. **Web:** once the listing is live, confirm the demo's "Get the full paper" link opens it.

---

## The one cost to plan now

**Every page is spent once** (the soul's own cost). A player can finish the season in a
weekend, and nothing refills it. The listing promises Season 2, so before 1.0 goes to
production, write down:

- Its size (30 editions × Morning and Night again, or smaller).
- Who writes it, and at what pace. Each line must advance the case and pass the
  fair-play and frame tests; writer and puzzle-setter share a desk.
- Whether chapter-end findings (the soul's fix for the Unproven Case) arrive with it.
- A target window, if the listing will state one. Otherwise keep the listing's "coming,"
  with no date.

It doesn't block shipping. It decides whether the promise in the listing is honest.

---

## After 1.0

In rough priority order. None blocks the release.

1. Season 2 content, with chapter-end findings.
2. Cloud: resolve the anonymous-write rules drift (ANDROID-REWRITE), deploy rules and
   index, then turn on sign-in and sync. The help-first boards are already built.
3. Primer tells that mark a tell as applied rather than as correct (SOUL.md, "Tone Killers
   Found").
4. Share card: time in whole seconds, printed after the help taken.
5. A web board, if the demo should have one (its tab labels need fixing first).

Further ideas, traced but not yet judged, are in [SOUL-FEATURES.md](SOUL-FEATURES.md).
Nine of them are already in the 1.0 build: the ledger, clean stamps, the next headline,
the author's workbench, the fair-play charter, the Night memo, the morgue, the tally's
worksheet counts, and set confirmation on the Primer. They are small, offline, and covered by tests, and
they belong in Track B's device pass.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| A device-only bug (IME, font, insets) surfaces after launch. | Track B on two phones, and staged rollout watched through Vitals. |
| The closed-testing rule adds two weeks. | Check A2 first; start the closed test the day the AAB is signed. |
| The paid app is judged against a free web version. | The web is a 3-edition demo, not the season, and says so. |
| Season 2 slips and the listing's promise goes stale. | Budget it now; keep the listing undated until the date is real. |
| Reviewers expect sign-in or a leaderboard. | The listing states offline and no accounts as features, not omissions. |
