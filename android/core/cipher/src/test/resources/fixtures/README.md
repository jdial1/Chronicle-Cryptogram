# Parity fixtures

Generated from the TypeScript game logic in `src/`. **Do not hand-edit.**

```
npm run emit:fixtures              regenerate
npm run emit:fixtures -- --check   fail if stale (runs in CI, .github/workflows/deploy.yml)
```

The TypeScript stays the source of truth. `:core:cipher` asserts against these
files, so the loop is: change TS → `--check` fails → regenerate → the Kotlin test
fails → update Kotlin. The two implementations cannot drift silently.

## Why this exists

Cipher glyph assignment is recomputed on every device from
`hashSeed(puzzle.id + puzzle.originalText)` and **never stored**. A Kotlin port
that diverges by one integer hands Android players a different cipher for the
same puzzle and the same cloud save, with no error anywhere.

## The two landmines `lcg.json` exists to catch

Both are invisible on inspection. A naive `Int` port fails 10 of the 12 LCG
starts in the fixture and the one `abs` case.

**1. `Math.abs` on `Int.MIN_VALUE`.** `hashSeed` truncates to int32 (`hash |= 0`),
but JS `Math.abs(-2147483648)` yields the *double* `2147483648`. Kotlin's
`abs(Int.MIN_VALUE)` returns `Int.MIN_VALUE` — still negative. The fixture pins a
real preimage (`intMinPreimage`) so this case is actually exercised.

**2. The LCG overflows `Int`.** `nextSeed(s) = (s * 9301 + 49297) % 233280` runs
on JS doubles, so nothing wraps. In Kotlin, `233279 * 9301 = 2_169_628_379` is
past `Int.MAX_VALUE`, and the *first* step operates on the un-modded
`abs(hash)` (up to ~2.1e9) × 9301 ≈ 2e13.

```kotlin
private fun hashSeed(s: String): Int {
    var hash = 0
    for (c in s) hash = (hash shl 5) - hash + c.code   // Int overflow == JS `|= 0`
    return hash
}
private fun nextSeed(s: Long): Long = (s * 9301L + 49297L) % 233280L
// currentSeed starts at abs(hashSeed(seed).toLong())
// j = floor((currentSeed.toDouble() / 233280.0) * (i + 1)).toInt()
```

## Files

| File | Pins |
|---|---|
| `lcg.json` | `hashSeed` over adversarial inputs (including the `Int.MIN_VALUE` preimage) and 64 `nextSeed` iterates from 12 starts |
| `palette.json` | `ZODIAC_SYMBOLS_PALETTE` in order — the Fisher-Yates shuffle indexes into this array, so order is load-bearing |
| `cipher-alphabet.json` | `buildCipherAlphabet` for all 61 puzzles: ordered `letterToSymbols` + `symbolIdToInfo` |
| `cipher-words.json` | `parseCryptogramText` for all 61: every cell's `symbolId`, `targetLetter`, `isPunctuation`, `char` |
| `frequencies.json` | `calculateSymbolFrequencies` including sort order and `percentage` — tie order is implementation-defined in both languages, so it is pinned |
| `progression.json` | `frontPageEdition`, `isNightUnlocked`, `isSeasonComplete`, `currentMorningPuzzle`, `chapterForEdition`, `editionLabel`, `groupIssues` over 10 solved-id sets |
| `merge-progress.json` | `mergeProgress`, `mergeGameStats`, `mergeSolvedIds`, `progressFields` |
| `normalize-progress.json` | `normalizeProgress` on hostile input, plus `clipHintedSymbolIds` / `clipSelectedSymbolId` |
| `wallets.json` | `clipDailyWallet`, `normalizeDailyHints`, `mergeDailyHints`, `isEditionKey`, `usedHintsFromProgress` / `usedChecksFromProgress` |
| `cursor.json` | `letterCells`, `cellCursor`, `nextOpenCell` (including wraparound and the fully-mapped `null`), `previousCell` |

## Two conventions in the data

- **`"<now>"`** in `merge-progress.json` (`freshStampSentinel`) marks an
  `updatedAt` that `mergeProgress` mints from the clock, because neither input
  carried a timestamp. Kotlin must put a current clock reading there. Every case
  whose inputs *do* carry timestamps pins the real merged value instead.
- **`"NaN"`** appears as a string in `wallets.json` where the input was `NaN`,
  since JSON has no NaN literal. Feed `Double.NaN` on the Kotlin side.

## Not covered here

`reconcileDailyHints` / `reconcileDailyChecks` read `localStorage`, so only their
pure core is pinned (`clipDailyWallet` over `usedHintsFromProgress` /
`usedChecksFromProgress`). The storage half belongs to `:core:data`.
