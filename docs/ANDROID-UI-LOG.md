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

## Pass 5 — the reading measure

**Theme:** the screens pass 4 did not turn sideways — archive, bureau, guide,
case file.

**Found:** none of them had a reading measure. The board caps itself at a column
width, with a comment in `DeskLayout` saying newsprint is unreadable at 1200px;
the list screens never got the same treatment. On a landscape phone the Bureau's
cards spanned all 2424px, so "Editions decoded" sat at one end of the desk with
"1 / 30" at the other.

`ReadingMeasure` is now a shared token, applied to the repeating unit on each
screen — the Bureau's card, the Guide's section, the Archive's row — with the
lists centred on it. The measure sits on the rows rather than the column so the
page background still covers the whole desk.

**The bug inside the fix:** the first attempt did nothing, because the modifiers
were in the wrong order. `fillMaxWidth().widthIn(max = …)` fixes the width first
and leaves the cap nothing to constrain; it has to be
`widthIn(max = …).fillMaxWidth()`. The Archive had been carrying that same
inverted order since it was written, so its 720dp cap had never once applied.

---

## Pass 6 — the share clipping

**Theme:** look at the image the app actually hands to the share sheet. It had
been written, wired and tested, and never once opened.

**It is correct.** Kicker, the cinnabar tab on the masthead rule, headline,
quote, figures and footer all render as intended, at 1080 x 706, sized to the
quote rather than to a fixed frame. Pulled off the device with
`adb exec-out run-as … cat` — plain `adb shell` corrupts a PNG by translating
line endings, which is worth remembering.

**Found, and deliberately not fixed: the stored timer loses its tenths.**

The clipping read `TIME 14:08.0` where the bulletin had shown `14:08.2`. The
clock counts in tenths and the bulletin prints them, but
`PuzzleProgress.timerSeconds` is an `Int`, so the fraction is dropped on save;
reopening a solved puzzle shows `.0`.

The web stores that field as a JS `number` and its `normalizeProgress` only
clamps, so it keeps the fraction. A save written there and read here loses it.

**The fixtures did not catch this because every timer value in them is a whole
number** — which says as much about the harness as about the bug.

Left alone on purpose. Widening the field runs through `Merge`, `DeskState` and
`FirestoreDesk`, the most parity-sensitive code in the project, and the visible
cost is one tenth of a second on a reloaded solve. Nothing about ranking or the
solve rate is affected: both take whole seconds. `TimerPrecisionTest` pins the
current behaviour so it stays a known divergence rather than a lurking one.
**This is a decision for the owner, not one to make in passing.**

---

## Pass 7 — the section rail's accessibility, and a false alarm

**Theme:** the open section is marked by a cinnabar rule and heavier type,
neither of which a screen reader can see. Does the rail say which section you
are in?

**It does.** `uiautomator dump` reports `selected="false"` on all five items,
including the open one, and that reading is wrong: it is describing a container
node, not the merged semantics node an accessibility service consumes. A Compose
test asserting `assertIsSelected()` passes, and passes on the untouched code —
verified by reverting and re-running, not assumed.

**What this pass actually produced:** `DeskBarTest`, which pins the contract that
was already being met. Worth having — the visual cue being correct is precisely
why a missing `selected` would go unnoticed — but no bug was found.

**The lesson is about the tool.** `uiautomator` has been reliable for driving
taps and for asking "is this on screen at all", which is what found the landscape
board. It is not a substitute for the semantics tree when the question is what a
screen reader will announce. For that, use a Compose test.

I briefly rewrote `Modifier.selectable` into `clickable` plus a hand-written
semantics block to "fix" this, then reverted it: the idiomatic version was right
all along.

---

## Pass 8 — the Night Extra

**Theme:** open a Night Extra. Every screen had been seen on night *paper* — the
user's theme setting — but the per-puzzle evening slot is a different axis and
had never been on screen.

Reaching one meant solving Edition 1 first, so `scripts/android-solve.py` reads
the glyph-to-letter mapping straight out of `cipher-words.json`, the golden
fixture that already holds every cell of all 61 puzzles. No screen-scraping, no
re-deriving the cipher: sixteen taps and the edition is solved.

**No bug found.** The Night Extra renders on the darker evening ground with the
cipher on a light folio, while the day theme is still selected — which is the
orthogonal-axes design working. Checked against the web rather than eyeballed:
`.is-night` there swaps `--paper-desk` and leaves the sheet on `--paper`, and
that is the same relationship Android draws.

I first read the light folio on the tan ground as a flipped contrast. It is not:
the Morning edition is a light sheet on a light desk, the Evening one a light
sheet on a dark desk, and comparing the two directly is what made it look wrong.

**Two shell traps worth recording**, both of which silently half-worked:

- A `while read` loop feeding `adb` lost its input, because the subprocess
  inherits stdin and eats the file. Read into an array first.
- Python writing a mapping file on Windows gives CRLF, so the letter carried a
  trailing `
` and every key tap missed. `tr -d '
'` before use.

---

## Pass 9 — traversal, and what a screen reader is handed

**Theme:** pass 7 asked which item is marked selected. This asks what a screen
reader walks through, and in what shape.

**Order is correct** — headline, kicker, then the cipher in reading order, which
for a cryptogram is the part that has to be right.

**Shape was not.** Every tile came through as **three stops**: the labelled tile,
the empty letter-slot placeholder, and the bare glyph again with no context. A
43-cell board was 129 stops, two thirds of them noise, and the carefully ported
label was immediately followed by the same glyph announced alone. Typewriter
keys were two stops each, and dock tools separated their caption from their
count.

All three now merge their descendants, so each is one stop carrying one label.

**Two false starts, both instructive**

1. I checked the fix with `uiautomator dump` and saw no change, because it
   reports something close to Compose's *unmerged* tree. That is the same tool
   that misled pass 7. The merged tree is what an accessibility service gets,
   and a Compose test is how to see it.
2. My first assertion was `no node has this text`, which failed — merging does
   not remove the glyph's text, it lifts it into the tile's own node. The second
   was `every node with this text is a tile`, which also failed: when the glyph
   is a Latin letter, the typewriter key for it legitimately carries the same
   text. The property that actually matters is that **nothing carries a glyph
   without saying what it is**, and that is what `BoardSemanticsTest` asserts.

---

## Pass 10 — reduced motion, which promised two things and did neither

**Theme:** the setting describes itself as *"Still keys and no letter jitter."*
Check both halves.

**Neither was true.**

- There was **no letter jitter in the app at all**, so half the sentence offered
  to switch off something that did not exist. The web stamps each letter
  +/-3 degrees and +/-1px; the port had skipped it.
- The typewriter's press animation **ignored the setting entirely**.
  `reduceMotion` reached the splash and nothing else.

Someone who turns this on is usually not expressing a taste, so a switch that
does nothing is worse than no switch at all.

Both are now real. `LocalReduceMotion` is a composition local provided by
`ChronicleTheme`, rather than a boolean threaded through four layers, so
anything animated later has to opt out rather than quietly forgetting.

The offset is derived from the cell and the letter instead of drawn at random,
so it survives recomposition with nowhere to remember it -- the web keeps a ref
for exactly that reason.

**The bug the test caught was not the bug it looked like.** "Every cell leaning
identically" looked like hash structure, and I mixed the seed to scatter it. The
real cause was that the seed string had been written with Kotlin's `$`-escape
intact, so every cell hashed the same literal text. The mixing is kept -- it is
cheap and correct -- but the comment now says what actually happened.

---

## Pass 11 — next

- **The archive at depth.** Only the first chapter has been opened; editions in
  the twenties, and the season finale, have never been on screen.
- **The case file as it fills.** It has only ever been seen nearly empty; the
  fragments arrive as editions are solved.
