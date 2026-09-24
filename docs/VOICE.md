# Who the player is

**An agent of the Bureau.** Not a reader of the Chronicle, not Thorne's
colleague, not a puzzle-app user with a theme on top.

The copy used to slide between all three, and that is what made a dozen small
wording decisions feel arbitrary — whether the app talks about "your progress"
or "this desk", whether a hint is a power-up or a note slipped across a table,
whether the leaderboard is a score screen or a board of filed times. Pick the
agent and those stop being decisions.

## What follows from it

**The desk is yours. The paper is evidence.** The Chronicle is not the product
being consumed; it is what the Bureau reads to work the Vance case. Hence
`Bureau File`, `agent plate`, `Agent Codename`, `Bureau Title`, "New agents
start on a Bureau primer". The player *works* the edition, they do not *read* it.

**Thorne is a colleague, not an avatar.** His case-file fragments are in his
first person ("I'm going to find out who did it") because they are his dossier,
filed to your desk. The app never speaks as Thorne, and the player never is him.

**Tools are tradecraft, not power-ups.** A hint is the Bureau telling you a
letter. A check is testing a guess against the file. Three of each per edition,
because the Bureau is not generous — never because a meter refilled.

**The Bureau is fallible and says so.** It prints what it is given. It does not
certify, verify, or clock anything it did not measure. See below.

**Failures are wire and press problems.** The network is "the wire". A stale
build is "a newer plate on the stands". Storage trouble is a jammed desk. An
agent in 1926 would not see a stack trace, and neither does this one.

## The one rule with a test behind it

Times reach the leaderboard straight from the client; nothing checks them. The
board may say it **printed** a time. It may not say it **checked** one.

"Verified!" and "Official Timings Certified by Bureau of Cryptanalysis" both
shipped once, and the in-fiction voice is exactly why they got through — an
integrity claim reads as flavour when it is wearing a period costume. It is the
one place where the charm works against the product.

Guarded on both surfaces:

- Web — `src/components/LeaderboardModal.test.ts`, and `src/components/voice.test.ts`
  for the copy in every component
- Android — `LeaderboardScreenTest.nothing on the board claims a time is verified`,
  and `VoiceCopyTest` for the string literals in every screen

The guard used to watch the leaderboard alone, and the clipping screen shipped
"CERTIFIED" and "OFFICIALLY DECRYPTED" right past it. That screen is gone.

The line both surfaces use: **"Times as filed by solvers."**

## Where the voice is already load-bearing

Worth reading before writing new copy, because they set the register:

- `src/data/cipherTactics.json` — the Primer's five tells, in tradecraft voice
  ("No mathematics. Just English, black coffee, and a sharp eye.")
- `src/data/primerPractice.json` — the drill pool. 1926 New York: the newsroom,
  the Bureau, Prohibition, the harbour. Nothing from another century; the drill
  is the first thing a new agent touches, and it sets the world before the case
  does. `src/data/content.test.ts` holds it to the five tells it promises.
- `src/components/CryptogramGrid.tsx` — what the board says out loud when a
  glyph fills, and when the board is decoded.
