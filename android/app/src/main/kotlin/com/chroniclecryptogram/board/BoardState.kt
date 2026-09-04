package com.chroniclecryptogram.board

import androidx.compose.runtime.Immutable
import com.chroniclecryptogram.cipher.BoardCell
import com.chroniclecryptogram.cipher.CipherCursor
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.PuzzleState
import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import com.chroniclecryptogram.cipher.model.Wallets

/**
 * Everything the board renders from, and the pure transitions between states.
 *
 * Deliberately not a ViewModel: keeping it a plain immutable value with pure
 * `fun` transitions means it tests on the JVM with no Android runtime, the same
 * reasoning that keeps :core:cipher free of Android. The ViewModel wrapper only
 * has to hold one of these and persist it.
 */
@Immutable
data class BoardState(
    val puzzle: PuzzleData,
    val words: List<CryptogramWord>,
    /** symbol id -> the letter it truly stands for. Never shown directly. */
    val answer: Map<String, String>,
    val mappings: Map<String, String> = emptyMap(),
    val selectedCellId: String? = null,
    val hintedSymbolIds: Set<String> = emptySet(),
    val verifiedSymbolIds: Set<String> = emptySet(),
    val flaggedSymbolIds: Set<String> = emptySet(),
    val hintsRemaining: Int = Wallets.DAILY_HINTS,
    val checksRemaining: Int = Wallets.DAILY_CHECKS,
    val timerSeconds: Double = 0.0,
    val isSolved: Boolean = false,
) {

    val cells: List<BoardCell> = CipherCursor.letterCells(words)

    /** Hinted and verified symbols are locked: the player cannot overwrite them. */
    val lockedSymbolIds: Set<String> = hintedSymbolIds + verifiedSymbolIds

    val selectedSymbolId: String?
        get() = cells.firstOrNull { it.cellId == selectedCellId }?.symbolId

    companion object {
        fun forPuzzle(puzzle: PuzzleData): BoardState {
            val cipher = PuzzleState.cipherForPuzzle(puzzle)
            return BoardState(
                puzzle = puzzle,
                words = cipher.words,
                answer = cipher.decoded,
            )
        }
    }
}

/**
 * The board's transitions. Pure functions over [BoardState], so every rule --
 * what a hint costs, when a flag clears, when the puzzle is solved -- is
 * testable without rendering anything.
 */
object BoardActions {

    /** Selecting a cell never changes the board, only the cursor. */
    fun select(state: BoardState, cellId: String): BoardState =
        state.copy(selectedCellId = cellId)

    /**
     * Assigns [letter] to the selected symbol, and therefore to *every* cell
     * showing that glyph -- that is the whole mechanic.
     *
     * A locked symbol is left alone. The cursor then advances to the next cell
     * with no guess yet, wrapping, so typing runs continuously.
     */
    fun type(state: BoardState, letter: String): BoardState {
        val symbolId = state.selectedSymbolId ?: return state
        if (symbolId in state.lockedSymbolIds) return state

        val mappings = LinkedHashMap(state.mappings).apply { put(symbolId, letter.uppercase()) }
        val next = state.copy(
            mappings = mappings,
            // A guess that changed clears its own wrong-marker; the player is
            // told again only when they ask for another check.
            flaggedSymbolIds = state.flaggedSymbolIds - symbolId,
        )
        return advance(next).copy(isSolved = isSolved(next))
    }

    /** Clears the selected symbol's guess, or steps back if it is already empty. */
    fun backspace(state: BoardState): BoardState {
        val symbolId = state.selectedSymbolId
        if (symbolId != null && symbolId in state.lockedSymbolIds) return state

        if (symbolId != null && state.mappings.containsKey(symbolId)) {
            return state.copy(
                mappings = state.mappings - symbolId,
                flaggedSymbolIds = state.flaggedSymbolIds - symbolId,
                isSolved = false,
            )
        }

        val previous = CipherCursor.previousCell(state.cells, symbolId, state.selectedCellId)
            ?: return state
        return state.copy(
            selectedCellId = previous.cellId,
            mappings = state.mappings - previous.symbolId,
            flaggedSymbolIds = state.flaggedSymbolIds - previous.symbolId,
            isSolved = false,
        )
    }

    /**
     * Reveals the selected symbol and locks it. Costs one hint from the
     * per-edition wallet, and does nothing on an already-solved symbol -- the
     * wallet is scarce and must not be spent for no gain.
     */
    fun hint(state: BoardState): BoardState {
        if (state.hintsRemaining <= 0) return state
        val symbolId = state.selectedSymbolId ?: return state
        if (symbolId in state.lockedSymbolIds) return state
        val truth = state.answer[symbolId] ?: return state

        val next = state.copy(
            mappings = LinkedHashMap(state.mappings).apply { put(symbolId, truth) },
            hintedSymbolIds = state.hintedSymbolIds + symbolId,
            flaggedSymbolIds = state.flaggedSymbolIds - symbolId,
            hintsRemaining = state.hintsRemaining - 1,
        )
        return advance(next).copy(isSolved = isSolved(next))
    }

    /**
     * Tests the selected guess. Correct locks it in; wrong takes the red circle.
     * Costs one check either way -- that is the tension.
     */
    fun check(state: BoardState): BoardState {
        if (state.checksRemaining <= 0) return state
        val symbolId = state.selectedSymbolId ?: return state
        if (symbolId in state.lockedSymbolIds) return state
        val guess = state.mappings[symbolId] ?: return state
        val truth = state.answer[symbolId] ?: return state

        return if (guess == truth) {
            state.copy(
                verifiedSymbolIds = state.verifiedSymbolIds + symbolId,
                flaggedSymbolIds = state.flaggedSymbolIds - symbolId,
                checksRemaining = state.checksRemaining - 1,
            )
        } else {
            state.copy(
                flaggedSymbolIds = state.flaggedSymbolIds + symbolId,
                checksRemaining = state.checksRemaining - 1,
            )
        }
    }

    /** Wipes every guess the player made. Locked symbols and the timer survive. */
    fun clearLetters(state: BoardState): BoardState = state.copy(
        mappings = state.mappings.filterKeys { it in state.lockedSymbolIds },
        flaggedSymbolIds = emptySet(),
        isSolved = false,
    )

    /** Restores a saved board. Flags are recomputed rather than trusted. */
    fun restore(state: BoardState, progress: PuzzleProgress): BoardState {
        val locked = (progress.hintedSymbolIds + progress.verifiedSymbolIds).toSet()
        val mappings = PuzzleState.withHintedMappings(
            state.puzzle,
            progress.mappings,
            locked.toList(),
        )
        val restored = state.copy(
            mappings = mappings,
            hintedSymbolIds = progress.hintedSymbolIds.toSet(),
            verifiedSymbolIds = progress.verifiedSymbolIds.toSet(),
            flaggedSymbolIds = PuzzleState.liveFlaggedIds(
                state.puzzle,
                mappings,
                progress.flaggedSymbolIds,
                locked.toList(),
            ).toSet(),
            hintsRemaining = progress.hintsRemaining,
            checksRemaining = progress.checksRemaining,
            timerSeconds = progress.timerSeconds.toDouble(),
            selectedCellId = null,
        )
        return restored.copy(isSolved = progress.isSolved || isSolved(restored))
    }

    fun toProgress(state: BoardState): PuzzleProgress = PuzzleProgress(
        mappings = state.mappings,
        timerSeconds = state.timerSeconds.toInt(),
        hintsUsed = Wallets.DAILY_HINTS - state.hintsRemaining,
        hintsRemaining = state.hintsRemaining,
        hintedSymbolIds = state.hintedSymbolIds.toList(),
        checksUsed = Wallets.DAILY_CHECKS - state.checksRemaining,
        checksRemaining = state.checksRemaining,
        verifiedSymbolIds = state.verifiedSymbolIds.toList(),
        flaggedSymbolIds = state.flaggedSymbolIds.toList(),
        selectedSymbolId = state.selectedSymbolId,
        isSolved = state.isSolved,
    )

    /** Every symbol on the board carries its true letter. */
    private fun isSolved(state: BoardState): Boolean =
        state.cells.isNotEmpty() &&
            state.cells.all { state.mappings[it.symbolId] == state.answer[it.symbolId] }

    private fun advance(state: BoardState): BoardState {
        val next = CipherCursor.nextOpenCell(
            state.cells,
            state.selectedSymbolId,
            state.selectedCellId,
            state.mappings,
        ) ?: return state
        return state.copy(selectedCellId = next.cellId)
    }
}

/** Night Extras exist; this keeps the slot decision in one place. */
fun PuzzleData.isNight(): Boolean = Edition.isNightEdition(this)
