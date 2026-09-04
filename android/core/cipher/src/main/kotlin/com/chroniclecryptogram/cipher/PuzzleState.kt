package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.cipher.model.HomophonicCipherMap
import com.chroniclecryptogram.cipher.model.PuzzleData

/** A puzzle's cipher plus the answer key, all derived from the puzzle itself. */
data class PuzzleCipher(
    val alphabet: HomophonicCipherMap,
    val words: List<CryptogramWord>,
    /** symbol id -> the letter it actually stands for. */
    val decoded: Map<String, String>,
)

/**
 * The pure half of `src/game/puzzleState.ts`.
 *
 * `getInitialPuzzle`, `loadPuzzleState`, `editionProgress` and `puzzleWasSolved`
 * are deliberately absent: they read local storage, so they belong to
 * `:core:data`. Keeping them out is what lets everything here be tested without
 * an Android runtime.
 */
object PuzzleState {

    /**
     * Builds the board and its answer key. Note the answer key never reaches the
     * player directly -- it backs hint reveals and the check-a-letter wallet.
     */
    fun cipherForPuzzle(puzzle: PuzzleData): PuzzleCipher {
        val alphabet = CipherEngine.buildCipherAlphabet(
            seed = puzzle.id + puzzle.originalText,
            homophonic = Edition.isHardPuzzle(puzzle),
        )
        val words = CipherEngine.parseCryptogramText(puzzle.originalText, alphabet)
        val decoded = LinkedHashMap<String, String>()
        for (word in words) {
            for (cell in word.symbols) {
                if (!cell.isPunctuation) decoded[cell.symbolId] = cell.targetLetter
            }
        }
        return PuzzleCipher(alphabet, words, decoded)
    }

    fun decodedMappingsFromPuzzle(puzzle: PuzzleData): Map<String, String> =
        cipherForPuzzle(puzzle).decoded

    fun decodedMappings(cells: List<Pair<String, String>>): Map<String, String> {
        val next = LinkedHashMap<String, String>()
        for ((symbolId, targetLetter) in cells) next[symbolId] = targetLetter
        return next
    }

    /** Forces every hinted or verified symbol to its true letter. */
    fun withHintedMappings(
        puzzle: PuzzleData,
        mappings: Map<String, String>,
        hintedSymbolIds: List<String>,
    ): Map<String, String> {
        val decoded = decodedMappingsFromPuzzle(puzzle)
        val next = LinkedHashMap(mappings)
        for (id in hintedSymbolIds) {
            decoded[id]?.let { next[id] = it }
        }
        return next
    }

    /**
     * Flags that are still wrong *right now*. A flag clears itself once the
     * player corrects the letter, and a locked symbol can never be flagged --
     * which is why this is recomputed on load rather than trusted from the save.
     */
    fun liveFlaggedIds(
        puzzle: PuzzleData,
        mappings: Map<String, String>,
        flaggedSymbolIds: List<String>,
        lockedSymbolIds: List<String>,
    ): List<String> {
        val decoded = decodedMappingsFromPuzzle(puzzle)
        return Merge.clipSymbolIds(flaggedSymbolIds).filter { id ->
            if (id in lockedSymbolIds) return@filter false
            val mapped = mappings[id]
            val truth = decoded[id]
            !mapped.isNullOrEmpty() && !truth.isNullOrEmpty() && mapped != truth
        }
    }

    /**
     * Keeps the board the player is actively typing on from being overwritten by
     * a cloud snapshot that arrives mid-solve. Everything except the board itself
     * still hydrates.
     */
    fun <T> gateCloudHydrate(
        dirty: Boolean,
        incoming: T,
        current: T,
        withBoard: (T, T) -> T,
    ): T = if (!dirty) incoming else withBoard(incoming, current)
}
