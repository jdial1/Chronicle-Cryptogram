# The soul of the game

**Casebook.** "Nothing goes in the file until you can prove it."

This is the design philosophy of the game, written down so it can settle arguments the
way [VOICE.md](VOICE.md) settles copy. VOICE.md says who the player is; this file says
what the game is for.

The soul lives in the Game Souls library (`C:\Users\justin.dial\game_souls`), in
`souls/casebook.txt`, and Chronicle Cryptogram is its source game. The library holds
only what is true of every Casebook game. This file holds what is true of this one:
the evidence, the field notes, the gaps, and the fixes. It follows the library's two
report formats (`LLM_SOUL_GUIDE.txt`, Steps 1–5 and Step 8).

The short version is four promises:

1. **The answer is the account.** What the agent decodes is a line of the case, and
   the case file quotes it back to them.
2. **The committed guess.** The board won't say a mark is right or wrong until the
   agent pays to ask, and the result prints what they paid. A clean solve beats a
   fast one.
3. **The sealed page.** Every edition can be finished in one sitting with what's on
   the desk, has one answer, closes completely, and leaves the case open.
4. **The agent works the file.** The player is an agent of the Bureau, and everything
   the interface says is the Bureau speaking, truthfully.

---

## Part 1: Soul Analysis

### Verb Inventory

| Verb | What the player literally does | Kinetic profile |
| --- | --- | --- |
| Select a mark | Tap a glyph; every copy of it lights up across the page | Not real-time. Instant and cancellable. |
| Assign a letter | Type a letter; every copy of that glyph fills at once, and the cursor moves on | Not real-time. Instant and cancellable (backspace, undo, wipe). |
| Spend a ration | Check the selected guess, or take a Hint for it | Not real-time. Committed: the spend is never refunded, not even by undo. |

Reading is the fourth thing the agent does, and the soul wants it to pay: the article
and the case file are the crib, not a detour.

### Fact Sheet

- **Interface:** a newspaper page of glyph tiles, a typewriter keyboard or the phone's
  own, a glyph tally (counts only, busiest first), the article behind a Story button,
  the case file, the archive, and the Bureau File. Every surface speaks in the
  Bureau's voice.
- **Rules:** a substitution cipher, the same on every device for the same page.
  Morning Edition: one glyph per letter. Night Extra: E, T and A each get two glyphs;
  every other letter keeps one. The page solves only when every mark is right. Each
  edition carries three checks and three hints, shared by its Morning and its Night.
- **Goals:** decode the page; fill the case file; solve clean.
- **Entities:** glyphs and marks, pages (Morning, Night Extra, Primer, drills),
  editions in five chapters, case-file fragments for seven people, the ration, the
  Bureau.
- **Entity manipulation:** assigning a letter fills every copy of its glyph. A hint
  reveals one glyph and locks it; a check locks a right guess or marks a wrong one
  red. Undo and wipe rewind typing but never a spend, or the letter a spend bought.
- **Economy shape:** **Drain, per installment.** The ration only shrinks, and it
  refills only when the next edition opens. Nothing carries over, nothing can be
  bought, and there is no currency. *The feeling:* careful stewardship, which is the
  deliberate, unhurried pace Armchair Intrigue wants.

### Axis Profile

| Axis | Position | Evidence | Confidence |
| --- | --- | --- | --- |
| Failure | Trivial (the board) / Costly (the receipt) | No lives, no give-up; a wrong board just sits (`useSolveCelebration.ts`). Every check and hint is spent from the edition's ration and printed on the result (`shareText.ts`). | High |
| Information | Fair Play (the answer) / Taught (the rules) | The Primer teaches the five tells (`cipherTactics.json`); nothing marks a guess except a paid check. | High |
| Authorship | Designer-Authored (the case) / Designer Space, Player Solution (each page) | 61 fixed pages; case fragments assemble from what's solved (`caseFiles.ts`). | High |
| Power | Understanding (of the craft and of the case) | No ranks, unlocks, or upgrades. The leaderboard title is decoration the player picks. | High |
| Tone | Armchair Intrigue | "No mathematics. Just English, black coffee, and a sharp eye." Typewriter strikes, a stamp, a murder on paper. MDA targets: Challenge, Narrative, Discovery. | High |
| Structure | Serial | 30 editions in five chapters, opened by progress, not the calendar (`edition.ts`). | High |

### Components

| Component | Strength | Evidence | Tuning |
| --- | --- | --- | --- |
| trusting_the_player | Core | No wrong-letter feedback; the tally shows counts without advice; the Primer's tells turn "Spotted" on their own. | Trust the player to deduce. |
| scarcity_economy | Core | Three checks and three hints per edition, shared by both pages; a check costs one whether it's right or wrong. | Scarcity is certainty. |
| legible_failure | Supporting | A failed check names the one wrong mark; a solved page reads as obvious in hindsight. | Retroactive and exact. |
| systemic_consistency | Supporting | One glyph means one letter everywhere, recomputed identically on web and Android (fixture-pinned). Night Extra departs from the Primer by one stated rule. | Consistency is what makes fair play provable. |
| environmental_storytelling | Supporting | The case arrives as clippings, journals, telegrams and dossiers, never as cutscenes. | The frame gives everything but the line. |
| theme_as_mechanic | Supporting | Decoding, filing and stamping are the fiction's own acts; hints are "the Bureau telling you a letter." | Investigation is the mechanic. |
| interface_voice | Supporting | VOICE.md; errors are "the wire is down"; times print "as filed"; a test on each surface bans verified/certified/official. | A period institution that doesn't lie. |
| difficulty_ladder | Supporting | The Night Extra opens after the Morning, harder by one named rule. | The ladder lives inside each installment. |

**Relationship conflicts** (from each component's Conflicts With tags):

- **difficulty_ladder** requires Runs or a Rebirth Account; this is a Serial.
  *Resolved:* the ladder has one rung per installment (Morning to Night Extra), not a
  climb after the credits.
- **trusting_the_player** conflicts with hint systems that give the answer.
  *Resolved:* hints exist, but three per edition, spent even on a right guess, and
  printed on the result.
- **systemic_consistency** conflicts with designer scripting that needs exceptions.
  *Resolved:* the cipher's rules never bend for the story. The one page that broke
  its rule (`day_4_hard`, which never split) was rewritten.
- **interface_voice** conflicts with retention-driven celebration UI. *Resolved:* the
  web's confetti burst is gone (and the dependency with it); the SOLVED stamp is the
  only celebration.

### Residue

1. **The answer is written into the record.** The decoded line is quoted, underlined,
   inside the case fragment it completes. No component covers a solution that becomes
   the story's own text.
2. **Confirmation is the scarce resource.** scarcity_economy explains a ration; it
   doesn't explain a game where the thing rationed is *being told you're right*, and
   where the result prints how much of it you bought.
3. **Installments that each close.** Every page stamps shut in one sitting while the
   case stays open. That is a structure (Serial), not a component.

### Cross-Comparison

| Soul | Axis Matches | Shared Components | Residue Overlap | Topology | Ideal Player |
| --- | --- | --- | --- | --- | --- |
| Hearthian | 2.5 (Power; half each for Failure, Information, Authorship) | trusting_the_player, legible_failure, systemic_consistency, environmental_storytelling | None: no record the player writes | None | Close (Mastery, Immersion) |
| Tapestry | 1 (Tone) | legible_failure, systemic_consistency, scarcity_economy | None | Zero-Sum | Different (Strategy, Expression) |
| Ampersand | 1.5 (Power; half for Failure) | trusting_the_player, scarcity_economy, theme_as_mechanic, interface_voice | Withheld confirmation, but of a person's answer | None | Opposite (Social high) |
| Spire | 0 | scarcity_economy, legible_failure, difficulty_ladder | Efficiency as prestige | Not named in the library | Different (Strategy high) |

### Verdict

**New Soul (Casebook).** No existing soul reaches four axis matches, and all three
residue items are uncovered. Hearthian is the nearest: both make understanding the
only power. Hearthian is one bounded world solved in any order; Casebook is a
sequence of sealed pages, each closing into a record the player keeps.

---

## Part 2: The Soul in This Game

### Psychological Target

Who the design serves, from `souls/casebook.txt`. This is the ideal player, not a
market.

| Motivation Pair | Level | Why, and what it means here |
| --- | --- | --- |
| Action | Low | No reflex play; time matters less than help taken. The clock is a record, not a race. |
| Social | Low | Solitary solving; spoilers are the social risk. Sharing is a receipt, not a feed. |
| Mastery | High | Clean solves with minimal help. The whole ration economy serves this. |
| Achievement | Medium | Filling the case file. |
| Immersion | Medium | A 1926 mystery told in documents. |
| Creativity | Medium | Discovery inside the page, one proven line at a time. |

**Design note:** speed competition (time leaderboards, fastest-solve figures) pulls
players away from reading and deducing. Any feature that serves Action or Social
players has to argue its way in.

### Signature Pillars, Translated

**1. The Answer Is the Account.**
- *Solve in Sentences:* every answer is one sentence of the case.
- *The Record Quotes the Player:* case fragments quote the decoded line, underlined
  (typewriter italics on Android, so it reads as evidence). A person appears only
  once something about them is on file; nothing lists what's still locked.
- *The Frame Is the Crib:* the article gives names, places and motive. Where a page
  could honestly be read two ways, the article carries the phrase that settles it
  (see the fair-play test below).
- *The Revelation Is Behind the Lock:* `frames.test.ts` fails any article that prints
  every long word of its answer, and warns above half.
- *You Can't Skip the Story Without Skipping the Puzzle:* the story is the plaintext.
  The article sits behind an optional Story button, which is the soft spot; the clock
  now stops while it's open, so reading costs nothing.

**2. The Committed Guess.**
- *Silence Until Committed:* no letter turns red while typing, and no control behaves
  differently when a guess is right (Hint used to grey out; it no longer does).
- *A Check Costs the Same, Right or Wrong:* one check per test, either way, and it
  tests exactly one glyph (*Confirm Narrowly*).
- *Print the Help Taken:* the share card and bulletin print `Hints n · Checks n`, or
  `Clean — no hints, no checks`. Both boards rank help first and time second. The
  free "Today's clue" slip is gone.
- *Tradecraft, Not Power-Ups:* three of each per edition "because the Bureau is not
  generous." The game is a one-time purchase: no ads, no coins, no hints for sale.

**3. The Sealed Page.**
- *Everything on the Page* and *Fair Play Is Provable:* see "What the solver can and
  can't prove" below.
- *One Sitting:* quotes run 26–59 letters.
- *Close the Puzzle, Open the Case:* a solved page is stamped and its glyphs removed;
  the season ends on "The Vance file is closed — for now."
- *Harder by a Rule, Not by Size:* the Night Extra splits E, T and A, and the Guide's
  "By Edition" notes say so. Every Night Extra now splits at least one of them.
- *Progress, Not the Calendar:* editions open one past the last run of solved
  Mornings. The streak and the daily notification were cut when editions stopped
  being dated, and the ration is keyed to the edition, not the day, so a whole season
  played in one sitting can't be farmed.

**4. The Player Works the File.**
- *A Role, Not an Avatar:* an agent of the Bureau. Thorne's fragments are his dossier,
  filed to the agent's desk; the app never speaks as him (VOICE.md).
- *The Institution Speaks:* Bureau File, agent plate, "the wire is down," "a newer
  plate is on the wire," "Times as filed by solvers." Drift remaining: the sign-in
  button now reads "Issue Agent Credentials", and leaderboard titles are desks the
  agent works (Night Desk, Wire Room), not ranks that look awarded.

### What the solver can and can't prove

A 30-letter substitution admits dozens of dictionary-valid word salads ("THE FATAL
SURE BAR IN THE CHAMPAGNE"), and an agent rules those out by sense, not by pattern. So
a word list can't prove whole-page uniqueness. What it can prove is the trap an agent
actually falls into: every word decoded but one, and that one still fits another
English word under the glyphs already fixed. `src/game/fairPlay.ts` reads glyph
patterns and the Handbook's rules, never the answer key for the word in question.
`src/data/__fairplay__/last-word-alternates.txt` is the full report, and
`fairPlay.test.ts` lists the eleven sensible rivals (DOSE/ROSE, ONE WAY/ONE DAY, OR SHE
WALKS/TALKS, OFFSHORE GOLD/BOND, and seven more), each with the article phrase or the
grammar that settles it. New content that adds a sensible rival fails until someone
decides it.

This is short of the library's full rule ("a solver that deduces… every page has
exactly one answer"). It covers the ambiguity players can reach, and says plainly
that it does not cover the rest.

---

## Part 3: Instillation Report

State after the alignment pass of September 2026.

### Tone Killers Found

The tone killer is **live correctness feedback**. None in the season. The two quieter
leaks (a Hint button that greyed out on a right guess, and a free clue outside the
ration) are closed.

The Primer's one bend is closed. Its tells used to turn "Spotted" the moment a single
letter landed on the correct glyph, which was free confirmation. They now confirm as
a set, after *Chants of Sennaar*: a tell is spotted only when every letter it covers is
right together (I and A; all of THE and AND), and says nothing before that. The sets
live in `cipherTactics.json` (`primerConfirms`), so both platforms read one list.

### Structural Conflicts

- **Topology:** Drain per installment, which matches the soul. No mismatch.
- **Relationship tags:** none unresolved.
- **Ideal player:** no features left serving a Low motivation. The live figures show
  Solvers and Rate only, and both bulletins lead with the help taken, with time in
  whole seconds beneath it ("Time on desk").

### Axis Gaps

| Axis | Soul | Target Today | Recommended Change |
| --- | --- | --- | --- |
| Failure | Trivial / Costly | Matches; the receipt is now printed | None |
| Information | Fair Play / Taught | Matches, with the solver's stated limit | None |
| Authorship | Designer-Authored / Player Solution | The player never decides anything about the crime (only the finale's frame asks) | Chapter-end findings (Season 2) |
| Power | Understanding | Matches | None |
| Tone | Armchair Intrigue | Matches | None |
| Structure | Serial | Matches; self-paced by progress | Budget Season 2 before 1.0 |

### Component Gaps

| Component | Status | Recommended Change |
| --- | --- | --- |
| trusting_the_player | Present | None |
| scarcity_economy | Present; two competing uses (Morning or Night), and the ration expires with the edition | None |
| legible_failure | Present | None |
| systemic_consistency | Present | None |
| environmental_storytelling | Present | Keep auditing frames as content grows |
| theme_as_mechanic | Present | None |
| interface_voice | Present | None |
| difficulty_ladder | Present, one rung per installment | None |

### Pitfalls Found

Scanned: every area whose components the game uses, plus Casebook's own four.
Reported only where the design shows evidence.

| Pitfall | Evidence in the design | Fix |
| --- | --- | --- |
| The Unproven Case (Casebook) | The agent proves 61 lines and decides nothing; only edition 30's frame asks a question. | Chapter-end findings, checked from the same ration (Season 2). |
| The Empty Top (Progress & Replay) | After edition 30 nothing is left; solved pages reopen already decoded. | Accepted cost ("Every Page Is Spent Once"): ship Season 2 on a budget, not a hope. |

Checked and not found: **The Cheerful Toast** (confetti removed; the stamp is the only
celebration), **The Stopwatch Takeover** (help leads every result; time prints in whole
seconds; no fastest or average times), **The Oracle** (every correctness surface now
costs or doesn't exist), **Wallpaper Story** (frames audited by test), **The Flavourful Lie** in
integrity claims (pinned by tests on both surfaces) and in titles (desks, not ranks), the
shared-image spoiler (Android's clipping prints the headline and receipt, never the
decoded line), **The Hoarding Trap** (the
ration expires with its edition, which is pressure to spend), **Scarcity Without
Choice** (Morning or Night), **Moon Logic**, **The Arbitrary Exception**. **The Pause
Loophole** is worth watching: any sheet stops the clock, and the board behind it is
only dimmed and slightly blurred. Because time now only breaks ties between equal
help, the loophole is worth little.

### Litmus Results

| Check | Pass/Fail | Note |
| --- | --- | --- |
| **The Account** | Pass | Case fragments quote the decoded line. |
| **The Oracle** | Pass | Checks cost either way; Hint doesn't read the guess; undo keeps paid letters (`puzzleState.test.ts`, `BoardActionsTest`). |
| **The Receipt** | Pass | Help printed; help ranks above time (`shareText.test.ts`, `SolveParityTest`, `boardRank.test.ts`, `StandingsTest`). |
| **The Solver** | Pass, with a stated limit | Last-word ambiguity only (`fairPlay.test.ts`). |
| **The Sitting** | Pass | One quote, one sitting, one stamp. |

### Prioritized Recommendations

Ranked by the library's order: tone killers, then structural conflicts, then axis
gaps, then components, then pitfalls, then pillars. Items 1–5 are applied; 6 is
Season 2 work.

| # | Mechanic → | Dynamic → | Tone |
| --- | --- | --- | --- |
| 1 (done) | Remove the confetti burst on solve; the stamp landing and the glyphs lifting off stay as the only celebration. | The agent's eye stays on the decoded line and the "Case File Updated" notice instead of a party. | The quiet click of an account that adds up: Armchair Intrigue, not an arcade win. |
| 2 (done) | Make the bulletin's headline the help line ("Clean", or hints and checks), and show the time below it in whole seconds as "Time on desk". | Agents read the receipt as the score and stop racing the tenths. | Deliberate deduction; speed only breaks ties. |
| 3 (done) | Drop Quickest and Average from the live figures; keep Solvers and Rate. Add a clean-solve share once solve receipts carry help. | No speed benchmark to chase on a page just finished. | The armchair pace; the page is judged by how little it took. |
| 4 (done) | Print the headline and the receipt on Android's shared clipping, not the decoded line. | A shared picture invites a friend to the page instead of handing them its answer. | Close the puzzle, open the case, for the next reader too. |
| 5 (done) | Rename "Issue Detective Credentials" to agent language, and drop or relabel the self-chosen leaderboard titles before any board goes live. | Every word the Bureau prints is something it would stand behind. | An institution that is stingy but never lies. |
| 6 | Season 2: end each chapter with a finding (who, how, or why) filed from proven lines and checked from the same ration. | Agents reread the case file to argue a conclusion, not just to collect it. | "Nothing goes in the file until you can prove it," applied to the crime itself. |

### Cost Warning

- **Every Page Is Spent Once.** Thirty editions can be read in a weekend. The listing
  already promises Season 2; budget it before 1.0 ships.
- **Writing Under Two Constraints.** Each new line must advance the case, be a fair
  puzzle, and pass the fair-play and frame tests. Writer and puzzle-setter share a
  desk, or the tests will reject content late.
- **Fairness Needs Tooling.** The last-word solver and its reviewed list are now part
  of the content pipeline. Every new sensible rival needs a decision: a crib in the
  frame, or a rewritten line.
- **Deploy before switching boards on.** `firestore.rules` requires `checksUsed` and
  `helpUsed` on leaderboard entries, and `firestore.indexes.json` holds the index the
  help-first query needs. Neither board posts in 1.0, so nothing breaks until then.

---

## History

**Round 2 features built, 24 September 2026** (from SOUL-FEATURES.md, borrowed from
outside the soul). The Guide opens with the Bureau's Rules of Fair Play, after Knox
and the Detection Club, claiming only what the tests enforce. The first Night Extra
opens with a memo stating its rule, after *Papers, Please*; the clock is stopped while
it's read. The case file has a morgue that searches decoded pages only, after *Her
Story*. The glyph tally counts word starts and doubles, never suggesting a letter. The
Primer confirms in sets, after *Chants of Sennaar*, which closes its bend. The strict
desk was folded into Clean rather than added as a second badge.

**Four brainstormed features built, 23 September 2026** (from
[SOUL-FEATURES.md](SOUL-FEATURES.md)). The Bureau File keeps a ledger of clean pages
and help requisitioned instead of a quickest time. The archive stamps a page "Clean"
when it was solved with no hint and no check, and shows nothing extra otherwise. The
solve bulletin prints the next page's headline, and only its headline, under "Next on
the wire" (never "tomorrow": progress, not the calendar). `npm run desk:check` runs every
press check (length, Night split, frame leak, last-word rivals) on a page or a draft
line. All four are on web and Android except the workbench, which is authoring
tooling.

**Re-run, 23 September 2026 (library commit `56f2dac`).** All five litmus rows pass;
no tone killer, topology mismatch, or unresolved relationship conflict. New findings:
the Primer's confirming tells (kept, as a training bend, above) and one small leftover
of the Stopwatch Takeover: the share card still prints the time in tenths, on the line
above the help taken. Both are post-1.0 polish. The 1.0 plan is in
[MVP-1.0.md](MVP-1.0.md).

**Alignment pass, September 2026.** The clock stops while a sheet covers the board or
the tab is hidden. The receipt prints help instead of accuracy, on both surfaces. Both
boards rank help first. The unreachable clipping (which said "CERTIFIED") is gone;
Share moved into the solve bulletin, which also offers the next Front Page after a
Night Extra. The voice guard reads every web component and every Android screen. Hint
no longer greys out on a right guess, and the free clue slip is gone. Undo keeps
letters a hint or check bought. `day_4_hard` now splits. Eleven articles stopped
printing their answers and three gained cribs. The finale's frame asks what became of
Clara Vance.

**Pacing, settled.** Stay self-paced. "Progress, Not the Calendar" says installments
open when the previous one is solved, which is what the campaign already does.
