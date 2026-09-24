# Features the soul suggests

A brainstorm, not a backlog. Each idea comes from a rule in the Casebook soul
([SOUL.md](SOUL.md), `game_souls/souls/casebook.txt`), and each is traced the way the
library asks, so it can be judged before anyone argues for it:

- **Mechanic →** the buildable change
- **Dynamic →** what players would do differently
- **Tone:** the feeling that behaviour produces

Round 1 (ideas 1–18) comes from inside the soul; Round 2 (19–36) borrows from outside
it: 1920s codebreaking, detective fiction, and other games.

Nine of these are built (marked **Built** below): 10, 13, 15 and 17 from Round 1, and
24, 27, 30, 31 and 33 from Round 2. Idea 32 was folded into Clean (see its entry). The
rest are not recommended yet and are outside the 1.0 scope ([MVP-1.0.md](MVP-1.0.md)). Every
idea carries the risk that would argue against it.

**How to judge one.** It earns a place only if the middle link is believable (players
really would behave that way), if it serves a motivation the soul rates High or
Medium (Mastery High; Achievement, Immersion and Creativity Medium; Action and
Social Low), and if its risk can be designed out rather than hoped away.

Cost is a rough band: **S** (days), **M** (a week or two), **L** (content or a season's
worth of work).

---

## From Pillar 1: The Answer Is the Account

### 1. The Bureau Finding
*Suggested by:* "Nothing goes in the file until you can prove it," and the fix for The
Unproven Case.

- **Mechanic →** At the end of each chapter, a finding page asks one question (who
  poured it, where the ledger went). The agent answers by choosing lines they have
  already proven from the case file, and the answer is checked from the same ration.
- **Dynamic →** Agents reread their own case file to build an argument, rather than
  collecting it and moving on.
- **Tone:** The crime itself is proven, not transcribed: armchair intrigue with a
  verdict at the end.

*Serves:* Mastery, Immersion. *Risks:* Moon Logic if a finding needs a leap the lines
don't support; a finding that's obvious from the chapter title is Wallpaper Story.
*Cost:* L (writing), M (the page). *Note:* the soul's own named fix.

### 2. Names on File
*Suggested by:* "The Frame Is the Crib": story knowledge is deductive leverage.

- **Mechanic →** Every proper noun the agent has decoded (VANCE, STERLING, PARIS) goes
  into a short index on the desk, in the agent's own proven spelling. It's shown
  beside the board as a list, never matched against the page.
- **Dynamic →** Agents try a known name against a word of the right length, the way a
  real cryptanalyst uses a crib.
- **Tone:** The case pays you back for reading it; you are working a file, not a
  puzzle book.

*Serves:* Mastery, Immersion. *Risks:* if it highlights where a name fits, it thinks for
the player (trusting_the_player); it must stay a list. *Cost:* S.

### 3. Cross-referenced case file
*Suggested by:* "The Record Quotes the Player."

- **Mechanic →** In the case file, a person's name inside a decoded line opens that
  person's file, and each fragment notes which edition's line it quotes.
- **Dynamic →** Agents follow a thread across people ("where else does the Packard
  come up?") and reread lines they proved weeks ago.
- **Tone:** The record behaves like a real dossier: the solving, collected and
  connected.

*Serves:* Immersion, Achievement. *Risks:* a link to a person not yet on file would list
the locked (a table of contents is a spoiler); link only to what's proven. *Cost:* S–M.

### 4. The season dossier
*Suggested by:* "Close the Puzzle, Open the Case," at season scale.

- **Mechanic →** When the season closes, the Bureau assembles "The Vance File": every
  line the agent proved, in order, typeset as one document they can reread.
- **Dynamic →** Agents read the whole case back in one sitting, in their own decoded
  words, often for the first time as a story.
- **Tone:** "I wrote this," which is the Account at its fullest.

*Serves:* Immersion, Achievement. *Risks:* sharing it spoils the entire plot, so only its
cover can travel; it must not be a reward screen with fanfare (The Cheerful Toast).
*Cost:* S–M.

### 5. Thorne's margin notes
*Suggested by:* "The Institution Speaks," and "Print the Help Taken."

- **Mechanic →** Some case fragments gain one short line from Thorne that depends on how
  the page was solved: clean, or with the Bureau's help. Written in his dossier voice,
  never a score.
- **Dynamic →** Agents notice that the file remembers how they worked, and some go
  cleaner next time to see the other note.
- **Tone:** A colleague's dry acknowledgement, not a trophy.

*Serves:* Mastery, Immersion. *Risks:* The Cheerful Toast if the notes flatter; the
Scoreboard feel if the hinted variant reads as a scolding. Doubles the writing for
those fragments. *Cost:* M (writing).

---

## From Pillar 2: The Committed Guess

### 6. Pencil marks
*Suggested by:* the Notebook Test the soul inherits from Hearthian, and "Silence Until
Committed."

- **Mechanic →** A second, lighter layer of tentative letters on a glyph that don't
  count toward the solve and can be inked in with one tap.
- **Dynamic →** Agents hold two hypotheses at once (is it SANK or SUNK?) instead of
  committing too early or reaching for a check.
- **Tone:** Visible, patient deduction, the desk of someone working it out.

*Serves:* Mastery. *Risks:* clutter on small screens; it must never color pencil marks by
correctness (The Oracle). *Cost:* M.

### 7. Proofread a word (confirm in a set)
*Suggested by:* "Confirm Narrowly, or Confirm in Sets."

- **Mechanic →** A second kind of check that tests a whole word and says only "the word
  stands" or "the word doesn't," never which letter is wrong. It costs one check.
- **Dynamic →** Agents commit to a word-level hypothesis and must then reason about
  which letter failed, rather than probing single glyphs.
- **Tone:** The Obra Dinn feeling: confirmation that has to be earned together.

*Serves:* Mastery. *Risks:* more information per ration makes pages easier, so the
ration may need retuning; two check types add choice but also UI (Scarcity Without
Choice becomes an actual choice, which is good). *Cost:* S–M.

### 8. Two kinds of tradecraft
*Suggested by:* "Tradecraft, Not Power-Ups," and Scarcity Without Choice's "two
competing uses."

- **Mechanic →** Replace the single Hint with two requisitions from one shared ration:
  "Wire for a letter" (today's reveal) and "Ask the copy desk", which says which of
  the page's one-letter words is I rather than A, or which glyph ends in a double.
- **Dynamic →** Agents choose what kind of help they need, and the weaker, cheaper help
  keeps more solves near-clean.
- **Tone:** A stingy institution with procedures; help as tradecraft, not a button.

*Serves:* Mastery. *Risks:* complexity in a game whose surface is deliberately plain;
"copy desk" help must never confirm a guess. *Cost:* M.

### 9. The requisition slip
*Suggested by:* "The Institution Speaks," applied to spending.

- **Mechanic →** Taking a hint or a check opens a one-line slip ("Requisition one
  letter. Two remain on this edition.") that the agent stamps to confirm.
- **Dynamic →** Fewer impulsive spends, because there is one deliberate beat between
  wanting help and taking it.
- **Tone:** The Bureau is not generous, and it makes you ask.

*Serves:* Mastery, Immersion. *Risks:* friction that annoys agents who decided already;
it needs a "don't ask again" to avoid becoming The Wordy Tutorial. *Cost:* S.

### 10. Clean stamps in the archive: **Built**
*Suggested by:* "Print the Help Taken," in the record rather than the share card.

- **Mechanic →** The archive marks each edition solved clean with a small "Clean"
  impression beside the Decoded stamp. Pages that took help show nothing extra.
- **Dynamic →** Agents aim for a clean first solve, knowing the archive keeps it.
- **Tone:** A quiet record of craft, in the Bureau's own ink.

*Serves:* Mastery, Achievement. *Risks:* intensifies The Hoarding Trap (never spending at
all); must never mark a page as "failed" (that becomes a Guilt Engine for one
player). *Cost:* S.

### 11. Training desk (opt-in assistance)
*Suggested by:* the Duck Detective bend in the soul's variants: an Oracle offered as a
mode the player chooses, never a leak.

- **Mechanic →** An accessibility setting that marks wrong letters as they're typed. It
  can't be switched on mid-page without marking that page "assisted," and assisted
  pages are never clean.
- **Dynamic →** Agents who would otherwise quit on a hard Night Extra keep reading the
  case.
- **Tone:** The contract bent openly, for people who need it; the default stays silent.

*Serves:* Immersion, for players the default loses. *Risks:* the soul's tone killer,
contained only by making it opt-in, sticky and labelled; toggling it to peek is the
failure to design against. *Cost:* S–M.

---

## From Pillar 3: The Sealed Page

### 12. A third rung: the Late City Final
*Suggested by:* "Harder by a Rule, Not by Size."

- **Mechanic →** A third, optional page on some editions, with one new rule named in the
  Guide: for instance, word breaks removed (the whole line in five-letter blocks), or
  a fourth letter split.
- **Dynamic →** Expert agents learn a new deduction skill (finding word boundaries)
  instead of grinding longer quotes.
- **Tone:** Cool mastery inside the armchair: the page got harder because the rule did.

*Serves:* Mastery. *Risks:* Unfair Rungs if the rule makes pages ambiguous (the fair-play
test must cover it); more content per edition. *Cost:* L.

### 13. The next question, printed: **Built** (as "Next on the wire")
*Suggested by:* "Close the Puzzle, Open the Case."

- **Mechanic →** After a solve, the bulletin prints the next edition's headline, and
  only the headline, under "On the wire tomorrow."
- **Dynamic →** Agents leave each page with the next question already in their heads,
  and come back to answer it.
- **Tone:** Satisfied and curious at once, the serial's pull.

*Serves:* Immersion. *Risks:* a headline that gives away the next turn (the frame audit
should run on headlines against the previous line); "tomorrow" wording implies a
calendar the game doesn't have ("Progress, Not the Calendar"). Say "next." *Cost:* S.

### 14. Frame first
*Suggested by:* "You Can't Skip the Story Without Skipping the Puzzle," and Wallpaper
Story.

- **Mechanic →** The first time a page opens, the article opens with it, over the board,
  with the clock stopped. After that, it stays behind the Story button.
- **Dynamic →** Every agent reads the crib at least once before typing, instead of only
  the ones who find the button.
- **Tone:** The case comes first; the cipher is where it leads.

*Serves:* Immersion. *Risks:* friction for fast agents (The Wordy Tutorial if the
article is long); a one-tap dismiss keeps it a frame, not a gate. *Cost:* S.

### 15. The author's workbench: **Built** (`npm run desk:check`)
*Suggested by:* "Fairness Needs Tooling" and "Writing Under Two Constraints."

- **Mechanic →** One command that takes a draft quote and article and prints its
  last-word rivals, its frame leak, whether its Night version splits, and its length
  against the season, before the line goes into `puzzles.json`.
- **Dynamic →** Writers revise a line while it's still a draft, rather than meeting a
  failing test after the case is written around it.
- **Tone:** For players, it shows up as pages that are always fair.

*Serves:* the writers, and through them every player. *Risks:* a tool nobody runs; wire
it into the content tests it mirrors. *Cost:* S (the pieces exist in
`src/game/fairPlay.ts` and `frames.test.ts`).

---

## From Pillar 4: The Player Works the File

### 16. Postings earned from the record
*Suggested by:* "A Role, Not an Avatar," and the Flavourful Lie fix (titles that look
earned should be).

- **Mechanic →** The agent's plate carries a posting the Bureau assigns from the record
  alone: Cipher Clerk to start, Night Desk after the first clean Night Extra, and so
  on up to a handful of postings, each tied to one plain criterion.
- **Dynamic →** Agents read their own record as a career and try the clean Night Extra
  they'd been avoiding.
- **Tone:** A place in the institution, given by the institution, not picked from a
  list.

*Serves:* Achievement, Mastery. *Risks:* stat-style progression sits badly with Power:
Understanding if it ever unlocks anything; postings must stay words, never power.
The pages are spent once, so there's no grind to worry about. *Cost:* S.

### 17. The agent's ledger: **Built**
*Suggested by:* "The Institution Speaks," and "Print the Help Taken."

- **Mechanic →** The Bureau File's record lists editions decoded, editions clean, and
  checks and hints requisitioned across the season, in place of the quickest-solve
  time.
- **Dynamic →** Agents measure themselves by help taken, the soul's measure, and the
  one remaining speed figure on the desk goes away.
- **Tone:** The desk keeps books on craft, not the stopwatch.

*Serves:* Mastery. *Risks:* few; a counter of spends could feel like a debt if phrased
as one ("owed"). *Cost:* S.

---

## Structure: the Serial

### 18. Rework the file
*Suggested by:* The Empty Top, against the soul's cost "Every Page Is Spent Once."

- **Mechanic →** After the season closes, the agent may rework it: every page returns
  with a fresh glyph assignment (a new seed), the case file already complete, and
  reworked pages stamped "Reworked," never "Clean."
- **Dynamic →** Returning agents solve again with the whole story known, so every frame
  is a pure crib, and practise the craft between seasons.
- **Tone:** A second pass at the desk: calmer, faster, still honest about what it is.

*Serves:* Mastery. *Risks:* it quietly admits the season is replayable and softens the
appetite for Season 2; the fixtures pin one cipher per page, so a second seed must
live beside them, not replace them. *Cost:* M.

---

## At a glance

| # | Idea | Pillar | Serves | Main risk | Cost |
| --- | --- | --- | --- | --- | --- |
| 1 | The Bureau Finding | Account | Mastery, Immersion | Moon Logic | L |
| 2 | Names on File | Account | Mastery | Thinking for the player | S |
| 3 | Cross-referenced case file | Account | Immersion | Listing the locked | S–M |
| 4 | The season dossier | Account | Immersion | Whole-plot spoiler | S–M |
| 5 | Thorne's margin notes | Account | Immersion | Flattery, or scolding | M |
| 6 | Pencil marks | Committed Guess | Mastery | Clutter | M |
| 7 | Proofread a word | Committed Guess | Mastery | Easier pages | S–M |
| 8 | Two kinds of tradecraft | Committed Guess | Mastery | Complexity | M |
| 9 | The requisition slip | Committed Guess | Mastery | Friction | S |
| 10 | **Built:** Clean stamps in the archive | Committed Guess | Mastery | Hoarding | S |
| 11 | Training desk | Committed Guess | Immersion | Tone killer, if it leaks | S–M |
| 12 | Late City Final | Sealed Page | Mastery | Unfair rungs | L |
| 13 | **Built:** The next question, printed | Sealed Page | Immersion | Spoiling the next turn | S |
| 14 | Frame first | Sealed Page | Immersion | Friction | S |
| 15 | **Built:** The author's workbench | Sealed Page | Writers | Nobody runs it | S |
| 16 | Postings earned from the record | Works the File | Achievement | Power creep | S |
| 17 | **Built:** The agent's ledger | Works the File | Mastery | Debt framing | S |
| 18 | Rework the file | Serial | Mastery | Undercuts Season 2 | M |

**Pairs that belong together:** 1 and 3 (a finding is easier to argue from a linked
file); 6 and 7 (pencil marks give a word-level check something to test); 10, 16 and 17
(one honest record, shown three ways). **Pairs that fight:** 11 against 10 and 16
(assisted pages must never count toward clean records); 18 against Season 2's pull.

**Deliberately absent:** anything that serves Action or Social play first (timed modes,
friend leaderboards, daily streaks, a feed). The soul rates those Low, and each would
reintroduce a pitfall this pass just removed.

---

# Round 2: Borrowed from outside

The first round came from inside the soul. This round goes looking elsewhere: the real
codebreakers of the game's own decade, detective fiction's fair-play tradition,
investigation and language games, and puzzle design generally. Each idea names what it
borrows and how sure we are of the source, then passes the same test as Round 1: a
believable middle link, a High or Medium motivation served, and a risk that can be
designed out.

A reference is a source of an idea, never a template. The rule is translated; the
source's mechanic isn't copied.

## Borrowed from the 1920s

The game is set in 1926 New York, and the decade was a golden age of American
codebreaking. That history is a quarry for mechanics, and every one of them arrives
already in period.

### 19. Budget cuts at the Bureau
*Borrowed from:* Herbert Yardley's Cipher Bureau, the "Black Chamber," which worked in
New York through the 1920s and was shut in 1929 when funding was withdrawn (Secretary
Stimson's "Gentlemen do not read each other's mail"). *(High confidence.)*
*Suggested by:* "Tradecraft, Not Power-Ups," and "Harder by a Rule."

- **Mechanic →** In a late chapter (or Season 2), a Bureau memo announces cuts: the
  ration drops from three checks to two. The memo arrives on the desk before the first
  page it applies to, and the Guide records it.
- **Dynamic →** Agents who leaned on checks change how they work, committing more
  before asking, exactly when the case is tightest.
- **Tone:** The institution is under pressure too, and the stinginess is now a plot.

*Serves:* Mastery, Immersion. *Risks:* reads as punishment if it isn't announced in
fiction first (The Arbitrary Exception); must never cut mid-page. *Cost:* S (rules),
M (writing the memo arc).

### 20. Rum Row intercepts: a codebook on top of the cipher
*Borrowed from:* Elizebeth Smith Friedman's Prohibition-era work for the US Coast Guard,
breaking rum-runners' radio traffic, which often layered code words over ciphers.
*(High confidence on her work; Medium on the exact code-over-cipher practice.)*
*Suggested by:* "Harder by a Rule, Not by Size."

- **Mechanic →** A new named rule for a later chapter: the decoded line is itself in
  smugglers' code ("TWELVE FISH AT THE CHURCH"), and a short code list captured in the
  same edition's article gives the meanings. The page solves on the plaintext; the
  case file quotes the decoded meaning beside it.
- **Dynamic →** Agents decode twice: letters first, then meaning, cross-reading the
  article for the code list.
- **Tone:** Real 1920s tradecraft, with the case one layer deeper.

*Serves:* Mastery, Immersion. *Risks:* Moon Logic unless every code word is on the page
("Everything on the Page"); the fair-play test must cover the code list. *Cost:* L.

### 21. Messages in depth
*Borrowed from:* the codebreaker's term "in depth": two or more messages sent under the
same key, which lets the breaker attack them together. Used from Room 40 (the 1917
Zimmermann Telegram) through Bletchley Park. *(High confidence on the term and practice.)*
*Suggested by:* "Harder by a Rule," and "Everything on the Page."

- **Mechanic →** A rare page carries two short intercepts enciphered with the same key.
  Neither is solvable alone; together they are. The Guide names the rule when it first
  appears.
- **Dynamic →** Agents solve across two lines at once, using a glyph that's obvious in
  one message to break the other.
- **Tone:** The real click of a break in depth: two halves of one proof.

*Serves:* Mastery. *Risks:* the fair-play test must judge the pair, not each line;
longer pages strain One Sitting. *Cost:* M (engine), L (content).

### 22. Telegraph conventions as a tell
*Borrowed from:* telegram style (STOP for a full stop, clipped grammar, word-count
economy) and the Bletchley "crib," a phrase known or guessed to appear in a message.
*(High confidence.)*
*Suggested by:* "The Frame Is the Crib."

- **Mechanic →** Intercepted telegrams keep telegraph style, and the Primer's drill pool
  adds a sixth tell: "Telegrams end sentences with STOP." Pages written as telegrams
  say so in their frame.
- **Dynamic →** Agents learn to hunt a four-glyph word that repeats at sentence breaks,
  a period-correct crib they can use for the rest of the season.
- **Tone:** Craft that belongs to the decade, learned at the desk.

*Serves:* Mastery, Immersion. *Risks:* a sixth tell must be taught and tested like the
other five (`content.test.ts` holds the drill pool to its tells). *Cost:* M (content).

### 23. A named ladder of cipher types
*Borrowed from:* the American Cryptogram Association (founded around 1930; verify the
year), whose members solve named types, among them the Aristocrat (word divisions
kept) and the Patristocrat (word divisions removed), under pen names called "noms."
*(High confidence on the types and noms; Medium on the founding year.)*
*Suggested by:* "Harder by a Rule," and "A Role, Not an Avatar." It refines idea 12.

- **Mechanic →** Each rung takes the name the tradition gives it: Morning Editions are
  Aristocrats, Night Extras are homophonic Aristocrats, and an optional Late City
  Final is a Patristocrat. The Guide explains each, and the agent's codename is their
  "nom."
- **Dynamic →** Agents can name what they're climbing, and experts reach for the rung
  they haven't beaten.
- **Tone:** A real craft with a real lineage: the agent joins a tradition, not a
  difficulty slider.

*Serves:* Mastery, Achievement. *Risks:* Unfair Rungs if the Patristocrat breaks fair
play (the last-word solver must learn lines without word breaks). *Cost:* M.

## Borrowed from detective fiction's fair-play tradition

### 24. The Bureau's rules of fair play: **Built** (the Guide's "Fair Play" page)
*Borrowed from:* Ronald Knox's "Ten Commandments" of detective fiction (1929) and the
Detection Club's oath (the club was founded in 1930), both written to promise readers
a fair puzzle, and both from the game's own era. *(High confidence.)*
*Suggested by:* "Fair Play Is Provable," and "The Institution Speaks."

- **Mechanic →** The Guide opens with the Bureau's own short charter, in period voice:
  every page can be read from what is on the desk; no page needs outside knowledge; no
  page has two sensible readings. It's a promise the tests already keep, stated to the
  player.
- **Dynamic →** Agents trust that a stuck page is solvable, and keep working it instead
  of reaching for a hint or quitting.
- **Tone:** The contract made explicit, the way a Golden Age novel promised it.

*Serves:* Mastery. *Risks:* a promise the content breaks is a Flavourful Lie, so the
charter must claim only what `fairPlay.test.ts` and `frames.test.ts` enforce. *Cost:* S.

### 25. Challenge to the agent
*Borrowed from:* Ellery Queen's "Challenge to the Reader," a page before the solution
declaring that the reader now holds every clue the detective had, first used in *The
Roman Hat Mystery* (1929). *(High confidence.)*
*Suggested by:* "Close the Puzzle, Open the Case," and the fix for The Unproven Case.

- **Mechanic →** Before a chapter's last page (or a Bureau Finding, idea 1), one page
  says: "The Bureau now holds every fact it needs. Who poured the champagne?" The
  agent answers it at a finding, or simply carries the question into the last page.
- **Dynamic →** Agents stop and reread before the reveal, so the last decoded line
  lands as confirmation of their own theory, or its refutation.
- **Tone:** The golden-age pause before the solution, the purest armchair moment.

*Serves:* Immersion, Mastery. *Risks:* must be true (every fact really is on file),
reviewed the way a finding is. *Cost:* S (the page), M (writing).

### 26. The story so far
*Borrowed from:* serial fiction's recaps: Dickens's monthly parts, magazine serials'
"The story so far," and radio serials. *(High confidence on the practice.)* Also the
Bad-Month Test the library gives Ritual games: be kind to a returning player, and
never be a guilt engine.
*Suggested by:* "Progress, Not the Calendar."

- **Mechanic →** Opening an edition after a long break shows "The story so far": three
  of the agent's own proven lines from the chapter so far, quoted from the case file.
  There is no count of missed days, because there are none.
- **Dynamic →** A player back after weeks away reconnects with the case in thirty
  seconds instead of quitting on a page whose names they've forgotten.
- **Tone:** The serial welcoming its reader back, in the reader's own words.

*Serves:* Immersion. *Risks:* The Cheerful Toast if it appears every time; show it only
after a real gap. *Cost:* S.

## Borrowed from investigation and language games

### 27. The morgue: **Built** (in the case file)
*Borrowed from:* *Her Story* (2015), where the player searches a police video archive
by typed keyword and sees only the few clips that match. *(High confidence.)* Also the
real newspaper "morgue," a paper's own clippings archive.
*Suggested by:* "The Record Quotes the Player," and "Everything on the Page."

- **Mechanic →** The case file gains a morgue: type a word, and it returns the solved
  pages whose decoded line or article contains it. Unsolved pages never answer.
- **Dynamic →** Agents chase a word across the season ("where did CANE come up?") and
  rediscover a crib they'd forgotten.
- **Tone:** Research in the paper's own files, a newsroom detective's habit.

*Serves:* Immersion, Mastery. *Risks:* if it can search unsolved text, it's an Oracle
and a spoiler; a test must prove it can't. *Cost:* S–M.

### 28. The pinboard
*Borrowed from:* *Shadows of Doubt* (2023) and detective fiction's "crazy wall":
evidence pinned to a board and joined with string. *(High confidence.)*
*Suggested by:* "The Answer Is the Account," and idea 1.

- **Mechanic →** The case file offers a board view: each person on file is a card, and
  each proven line is a note pinned to the people it names. The agent may draw their
  own strings between cards, and the game never grades them.
- **Dynamic →** Agents lay out a theory spatially and see which people share lines,
  ahead of a finding.
- **Tone:** The desk at midnight, strings everywhere, one of them right.

*Serves:* Creativity, Immersion. *Risks:* a board that draws strings for the player
thinks for them, so only the agent's own strings appear; small screens make boards
hard. *Cost:* M.

### 29. A family tree, confirmed in threes
*Borrowed from:* *Return of the Obra Dinn* (fates confirmed only three at a time) and
*The Roottrees Are Dead* (a family tree whose identities lock in sets). *(High
confidence on Obra Dinn; Medium on Roottrees' exact rule.)*
*Suggested by:* "Confirm in Sets," and the Vance family's hidden-parentage plot.

- **Mechanic →** A season finding in the form of a household chart: who is whose
  parent, spouse and partner in the Vance circle. Relationships lock in only when three
  are right together, and each attempt costs a check.
- **Dynamic →** Agents reason about the whole family at once, since one right guess
  alone confirms nothing.
- **Tone:** The case's central secret, proven as a structure rather than a sentence.

*Serves:* Mastery, Immersion. *Risks:* testing one slot at a time to find the wrong one
is set confirmation's known weakness, so the check cost must make that expensive.
*Cost:* M.

### 30. The Primer confirms in sets: **Built**
*Borrowed from:* *Chants of Sennaar* (2023), whose notebook confirms a page of glyph
meanings only when several are matched correctly together, never one at a time.
*(High confidence.)*
*Suggested by:* "Confirm in Sets," and the Primer bend recorded in SOUL.md.

- **Mechanic →** The Primer's tells stop turning "Spotted" per letter. A tell confirms
  only when every letter it covers is right together (all of THE; both N and T), and
  says nothing until then.
- **Dynamic →** New agents learn that confirmation comes from a consistent whole, the
  habit every later page asks of them, instead of probing letters until one lights up.
- **Tone:** The training page teaches the soul's contract instead of bending it.

*Serves:* Mastery. *Risks:* a first page that feels unresponsive; the tell's advice
text still carries the teaching. *Cost:* S. *Note:* this closes the one bend the
re-run found.

### 31. Bureau memos introduce new rules: **Built** (for the Night Extra)
*Borrowed from:* *Papers, Please* (2013), where each new rule arrives as a bulletin at
the inspector's booth and applies at once. *(High confidence.)*
*Suggested by:* "Harder by a Rule," and "The Institution Speaks."

- **Mechanic →** The first Night Extra, and every later new rule (ideas 19–23), opens
  with a short memo on the desk explaining the rule in Bureau voice. The Guide keeps
  the full text.
- **Dynamic →** Agents meet each rule at the moment it matters, and don't solve a Night
  Extra as if it were a Morning.
- **Tone:** New orders from upstairs, a working agent's day.

*Serves:* Mastery, Immersion. *Risks:* The Wordy Tutorial if memos run long; keep them
to a paragraph, shown once. *Cost:* S.

## Borrowed from puzzle design and accessibility

### 32. The strict desk: **Folded into Clean**
*Borrowed from:* *Wordle*'s Hard Mode, an opt-in constraint (revealed letters must be
reused) chosen for pride rather than reward. *(High confidence.)*
*Suggested by:* The Empty Top, and "Print the Help Taken."

- **Mechanic →** An opt-in setting: no hints on this desk, checks only. Pages solved
  under it print "Strict" on the receipt. It can be switched on at any time but never
  off mid-page.
- **Dynamic →** Expert agents make the season harder on purpose, and newcomers never
  meet it.
- **Tone:** Pride in craft, entirely self-imposed.

*Serves:* Mastery. *Risks:* a second badge beside "Clean" dilutes both. "Strict" should
mean the constraint was on; "Clean" that no help was taken. *Cost:* S.

*Decision:* not built as its own mode. Hints are already printed on every receipt, so
a hint-free solve already shows as "Clean", or as "Checks n" with no hints. A Strict
badge would restate that under a second name, so it merges into Clean.

### 33. A worksheet, not a tally: **Built**
*Borrowed from:* the period's pencil-and-paper frequency and contact worksheets (the
Friedmans' training texts teach counting letters and their neighbours). *(Medium
confidence on specific worksheet forms.)*
*Suggested by:* trusting_the_player's Casebook tuning: show counts, never advice.

- **Mechanic →** The glyph tally adds two plain counts: how often a glyph appears
  doubled, and how often it starts a word. Numbers only, never a suggested letter.
- **Dynamic →** Agents apply the Primer's double-letter and short-word tells with
  evidence in hand, instead of scanning the board for it.
- **Tone:** The analyst's worksheet: method, not magic.

*Serves:* Mastery. *Risks:* sliding into advice ("probably E") would think for the
player; every figure must be a count of something visible. *Cost:* S.

### 34. Reading options outside the fiction
*Borrowed from:* the Game Accessibility Guidelines and common reading-support practice
(letter spacing, larger type, high contrast, a plainer face). *(High confidence on the
guidelines' scope; how much a given font helps varies by reader.)* The library's own
rule applies: accessibility is not diegesis.
*Suggested by:* "Everything on the Page": a page every agent can read comes before a
page every agent can solve.

- **Mechanic →** A reading setting for decoded letters and articles: wider letter
  spacing, a plain sans face as an alternative to the typewriter, and larger glyph
  tiles. The cipher glyphs themselves never change shape.
- **Dynamic →** Players who struggle with period type can still read the article (the
  crib) and the plaintext.
- **Tone:** The desk stays 1926, and the reader doesn't have to be.

*Serves:* everyone the default type loses. *Risks:* few; the setting lives outside the
fiction, in plain words. *Cost:* S.

### 35. A quiet newsroom
*Borrowed from:* *Papers, Please*'s stamp and paper sounds, and *Her Story*'s low
ambient room, both of which make a desk job feel physical. *(High confidence.)*
*Suggested by:* Armchair Intrigue, and interface_voice's "say only what is true, once."

- **Mechanic →** Optional sound: a typewriter strike per letter, the thump of the stamp
  on a solve, a page turn for the article, and a faint room tone. No jingle, and no
  sound that differs between a right letter and a wrong one.
- **Dynamic →** Agents with sound on feel the page as paper and ink, and hear the stamp
  as the only celebration.
- **Tone:** A quiet room with a crime in it.

*Serves:* Immersion. *Risks:* an Oracle if any sound depends on correctness; The Buzzer
if it's loud; off by default on phones. *Cost:* S–M (assets).

### 36. The annotated handbook
*Borrowed from:* *Tunic* (2022), whose in-game manual is found a page at a time and
reread as understanding grows. *(High confidence.)*
*Suggested by:* "The Frame Is the Crib," and "Close the Puzzle, Open the Case."

- **Mechanic →** The Guide's tactic pages gain a margin that fills with examples from
  the agent's own solved pages ("THE, on edition 3"), drawn only from what they placed
  on pages already solved.
- **Dynamic →** Agents reread the handbook as a record of their own method, and reuse
  the move on the next page.
- **Tone:** The agent's handbook, annotated by the agent.

*Serves:* Mastery, Achievement. *Risks:* the game knows what was placed, not why; keep
the notes factual and never claim a method the agent didn't use. *Cost:* M.

---

## Round 2 at a glance

| # | Idea | Borrowed from | Serves | Main risk | Cost |
| --- | --- | --- | --- | --- | --- |
| 19 | Budget cuts at the Bureau | Yardley's Black Chamber | Mastery, Immersion | Feels punitive | S–M |
| 20 | Rum Row codebook | Elizebeth Friedman | Mastery, Immersion | Moon Logic | L |
| 21 | Messages in depth | Room 40, Bletchley Park | Mastery | Fair play across pairs | M–L |
| 22 | Telegraph conventions as a tell | Telegram style, cribs | Mastery | A sixth tell to teach | M |
| 23 | A named ladder of cipher types | American Cryptogram Association | Mastery | Unfair rungs | M |
| 24 | **Built:** The Bureau's rules of fair play | Knox, the Detection Club | Mastery | A promise that could lie | S |
| 25 | Challenge to the agent | Ellery Queen | Immersion | Must be true | S–M |
| 26 | The story so far | Serial fiction | Immersion | Shown too often | S |
| 27 | **Built:** The morgue | *Her Story* | Immersion | Searching the unsolved | S–M |
| 28 | The pinboard | *Shadows of Doubt* | Creativity | Thinking for the player | M |
| 29 | A family tree, confirmed in threes | *Obra Dinn*, *Roottrees* | Mastery | Slot probing | M |
| 30 | **Built:** The Primer confirms in sets | *Chants of Sennaar* | Mastery | An unresponsive first page | S |
| 31 | **Built:** Bureau memos | *Papers, Please* | Mastery, Immersion | Wordy tutorial | S |
| 32 | **Folded into Clean:** The strict desk | *Wordle* Hard Mode | Mastery | Badge dilution | S |
| 33 | **Built:** A worksheet, not a tally | 1920s worksheets | Mastery | Sliding into advice | S |
| 34 | Reading options | Game Accessibility Guidelines | Access | Few | S |
| 35 | A quiet newsroom | *Papers, Please*, *Her Story* | Immersion | A correctness sound | S–M |
| 36 | The annotated handbook | *Tunic* | Mastery | Claims about "why" | M |

**Where Round 2 meets Round 1:** 25, 28 and 29 are three ways to build the Bureau
Finding (1): a question, a board, or a chart. 23 names the rungs that 12 proposed, and
31 is how any new rung, cut (19) or code (20) should arrive. 30 replaces the Primer's
one soul bend. 24 turns the fair-play tests into a promise the player can read.

**For Season 2:** 19, 20, 21 and 22 are all period-true rule changes, so any one can be
Season 2's new rung, announced with 31. Together with the Finding, they give Season 2
a mechanical identity, not just more pages.

**Sources to verify before building on them:** the American Cryptogram Association's
founding year (23), the exact code-over-cipher practice of Prohibition radio traffic
(20), *The Roottrees Are Dead*'s confirmation rule (29), and the forms of period
worksheets (33). Everything else is marked High confidence.
