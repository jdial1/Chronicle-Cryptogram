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

## Pass 3 — next

Candidates not yet swept, in rough order of likely yield:

- **Rotation and short screens.** Nothing has been looked at in landscape, where
  the dock, keyboard and board compete for a much shorter viewport.
- **TalkBack order and grouping.** Labels exist everywhere; whether the reading
  order and grouping make sense has not been checked.
- **The solved state.** `SolveBulletin`, the live stats row and the share
  clipping have never been seen on a real solve, only in tests.
