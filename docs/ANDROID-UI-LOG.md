# Android UI review log

A running record of the review passes over the native Android build: what each
one looked at, what it changed, and what it deliberately left. It exists so a
later pass does not re-tread an earlier one, and so the reasoning behind a fix
outlives the session that made it.

Each pass takes a **theme that cuts across the whole app** rather than polishing
one screen, because the bugs worth finding are the ones that repeat.

---

## Pass 1 — the settings, actually toggled

**Theme:** turn every setting on and look at what it does, rather than trusting
that it does anything.

**Found and fixed**

- **The system keyboard never opened.** `SystemKeyboardField` put `.focusable()`
  on a `BasicTextField`, which is already a focus target; the extra one took the
  focus, so the field never held it and `show()` had nothing to open.
  `dumpsys input_method` reported `mInputShown=false` throughout. The effect is
  now keyed on the selected cell id rather than on whether any cell is selected,
  so re-picking a glyph after dismissing the keyboard brings it back.
- **A slab of dead paper above the IME.** The board's `imePadding` insets from
  the bottom of the screen, but its box already stops above the section rail, so
  it over-inset by exactly the rail's height. The rail now steps aside while the
  IME is visible.
- **The guide described the wrong desk.** It documented "Smaller Type" and
  "Larger Type" — zoom controls this build deliberately does not have — and
  omitted Undo, which the dock does. Corrected Android-side; removing zoom from
  the shared file would make it wrong for the web.

**Tooling:** `scripts/android-ui-tour.sh` drives the app by accessibility label
instead of by pixel guess. Earlier passes had captured screens where the tap had
silently missed and nothing had happened.

**Left alone:** the shared `cipherTactics.json` still omits Undo for the web,
which has a dock button for it. That is a web-side gap, not an Android one.

---

## Pass 2 — large type

**Theme:** the font-scale sweep. This is the reason the rewrite exists: the web
build sizes tiles in `rem`, which ignores Android's font-scale setting entirely,
so a player at 2.0 gets clipped letters and reaches for an in-app zoom control to
compensate. The claim that Kotlin fixes this has never been checked on a device.

**Found and fixed**

- **The section rail clipped its own labels.** At 2.0 "Archive" rendered as
  "ARCHIV", "Case File" as "CASE", and "Bureau" ran off the right edge. Five
  fixed columns cannot absorb unbounded type.
- **The dock lost a wallet count.** "CHECK 3" was cut to "CHECK" while "HINT 3"
  survived, so one of the two scarce resources silently stopped reporting itself.
- **The coach rail clipped to "Five tells of".** Now wraps to two lines.
- **The board was pushed off the Primer entirely.** Masthead plus coach filled
  the viewport, so the one screen whose point is the cipher opened showing none
  of it. The coach now starts folded above 1.3 and opens on a tap, carrying the
  current tell's title in the rail so nothing is lost while folded.

**The fix, and its cost:** `CompactChrome` caps how far a subtree follows the
system font scale, applied to the section rail and the dock only. Chrome stops
growing at 1.3; everything the player reads — the quote, the case files, the
guide, the coach's advice — keeps scaling without limit. Ellipsising instead
would have made the truncation tidier without making the labels readable, and
these are the app's primary navigation.

**Verified, not assumed:** the tiles themselves scale correctly at 2.0. That is
the claim the whole rewrite rests on — the web sizes tiles in `rem` and ignores
the setting — and until this pass it had never been checked on a device.

**Clean at 2.0 with no change needed:** archive rows, the bureau's segmented
control and switch rows, the guide, the case file.

---

## Pass 3 — the solved state

**Theme:** actually solve a puzzle. `SolveBulletin`, the live stats row and the
share clipping had only ever been exercised by tests; nothing had rendered them
on a device. `scripts/android-solve-primer.sh` does it in sixteen taps by lining
the board's accessibility labels up against the Primer's known plaintext.

**Found and fixed — the solve clock never ran**

`timerSeconds` was read in nine places and incremented in none. `DeskTimer`
existed, was fixture-tested against the web's `useDeskTimer`, and had no caller
at all — the same shape of bug as `FirestoreDesk` having no factory.

Every solve therefore reported **00:00.0**, and the consequences ran well past
cosmetics: both the leaderboard and the public solve counters refuse a time
under five seconds, so **no Android player could ever post a time or be counted
as a solver.** The whole posting path was dead behind a zero.

The clock is now a suspending function the desk collects rather than a job the
ViewModel starts for itself, so the caller's scope decides when time accrues: it
stops when the desk leaves the screen and when the app is backgrounded — reading
the archive is not solving — and a test can drive it on a virtual clock instead
of hanging on an endless loop. Verified on device: a real solve now reads
**14:08.2**.

**Learned — and it corrects an earlier conclusion**

Pass 2's report said every Firestore write was refused and blamed the shared
`isOwner()` → `isAuthenticated()` gate, implying anonymous users are rejected
outright. **That was wrong.** Solving proved it: the `starts` receipt and the
`puzzleStats` increment both *succeeded* for the same anonymous user — the
public solve rate moved from 33.3% to 32.1% (9/27 → 9/28) on this device's own
start. So `isAuthenticated()` passes.

What is actually refused is narrower:

| Path | Write | Gate |
|---|---|---|
| `starts/{uid}_{id}` | **accepted** | `isAuthenticated()` |
| `puzzleStats/{id}` | **accepted** | `isAuthenticated()` |
| `solves/{uid}_{id}` | refused | `isAuthenticated()` + `isValidSolve` |
| `users/{uid}` and subcollections | refused | `isOwner()` + per-collection validators |

Since `starts` and `solves` share the same auth gate, the auth gate is not the
cause. It is `isOwner()` or the validators themselves — which still points at the
console, but at a much smaller patch of it than pass 2 claimed.

---

## Pass 4 — rotation

**Theme:** turn the phone sideways. Never looked at before this pass.

**Found:** the game was **unplayable in landscape.** The cipher rendered zero
visible tiles — not clipped, not scrolled, simply not on screen. The desk is
about 310dp tall there, and everything else took its cut first.

Three separate causes, found in order by measuring rather than guessing:

1. **The side rail was the tall one, not the keyboard.** `usesSideRail` is
   chosen on width alone, and a phone in landscape is wide but short: five
   stacked tools at the 48dp accessible minimum come to ~260dp of a ~310dp desk.
   It is now chosen on height as well, and a short desk gets the flat dock,
   which costs one row instead of five.
2. **The keyboard sized itself from width alone.** At 881dp wide the widest row
   licensed 52dp keys; three rows of those swallowed the window. It now takes a
   height budget and uses whichever dimension is tighter.
3. **Even then the stack did not fit.** Masthead, board, dock and keyboard
   cannot share 310dp. On a wide, short desk they are now laid out **side by
   side** — board left, instrument right — which gives the board the full height
   and the keyboard its own width. The masthead drops its press plate and goes
   to one line, since decoration yields before the cipher does.

**Also fixed on the way**

- **The board kept the previous edition's scroll position.** Opening a new
  puzzle left it wherever the last one had been scrolled to, which in a short
  window meant landing on blank paper. Each edition now starts at its own top.
- **The key bank sat against one edge** with a slab of empty bed beside it
  whenever the keys were capped. Centred now.

**Why the existing tests missed all of it:** `AdaptiveLayoutTest` asserted that
the *tools* existed, which stayed true the entire time the board was being
squeezed to nothing. The new landscape cases assert a cipher tile is on screen —
before the fix, zero matched; after it, twenty-nine do.

---

## Pass 5 — next

- **TalkBack order and grouping.** Labels exist everywhere; whether the reading
  order and grouping make sense has not been checked.
- **The share clipping.** Rendered but never opened: nobody has looked at the
  image `Clipping` actually produces.
- **The night edition.** Every screen has been seen on night *paper*, but no
  Night Extra puzzle has been opened, which is a different thing.
- **Landscape for the other screens.** Only the desk was looked at this pass;
  archive, bureau, guide and case file were not.
