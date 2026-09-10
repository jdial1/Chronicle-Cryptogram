# Palette's Journal — Chronicle Cryptogram

Critical UX/accessibility learnings only. Not a log.

## 2026-09-10 - The Primer coach loses its rail and its copy on a phone

**Learning:** `.primer-coach-rail` and `.primer-coach-copy` are both `display: none`
under `@media (max-width: 767px)` (src/styles/paper.css). On a phone the entire
Five Tells panel collapses to one line: the tell number and its title. Anything a
player needs from that panel on mobile — state, progress, an affordance — has to
live in the card's header row, because the rail (prev/next, "N of 5") and the body
copy are simply not there. That is also why the panel's found/not-found state was
carried by card colour alone: on desktop the copy softens it, on mobile the colour
was the whole message.

**Action:** Before adding anything to `PrimerCoach`, check it against the 767px
rule. If it belongs in the rail or the copy, a phone player will never see it.
Put state signals in the header row and let them wrap (`flex-wrap` + `ml-auto`),
since the tell titles run long ("Attack the Single-Letter Words First").

## 2026-09-10 - The board never takes focus, so tile ARIA is unreachable

**Learning:** `CryptogramGrid` tiles are `<button>`s with careful `aria-label`s
("Cipher glyph W, mapped to T"), but every tile calls
`onPointerDown={(e) => e.preventDefault()}` and the physical-keyboard listener lives on
`window` — so `document.activeElement` stays `BODY` during play. A screen reader never
reads those labels, because nothing is ever focused. Rich per-element ARIA is dead weight
here; state changes have to reach the user through a live region instead. The stakes are
higher than usual because the game's signature move fills *every* copy of a glyph at once
— the single biggest visual event in the app had no audible equivalent at all.

**Action:** In this app, judge accessibility by "what would a live region say?", not by
auditing `aria-label` coverage. Before adding ARIA to anything on the board, check whether
that element can actually receive focus. Deliberate focus suppression (needed to keep the
mobile keyboard down) is a codebase-wide constraint — do not "fix" it by removing the
`preventDefault`.

## 2026-09-10 - Identical live-region text is silent

**Learning:** Setting a `role="status"` region to the same string twice is a no-op for
screen readers — no DOM change, no announcement. In a cryptogram this hits constantly:
typing K onto three different single-copy glyphs yields "K typed onto 1 mark." three
times, and only the first is ever heard.

**Action:** Keep a monotonic `seq` in state next to the message and render the text in a
`<span key={seq}>`. React unmounts and remounts the text node, so the region reports a
childList change even when the string is identical. Verified with a `MutationObserver`:
three repeats produce three REM/ADD pairs. Prefer this over padding the string with
zero-width characters, which screen readers may voice as punctuation.
