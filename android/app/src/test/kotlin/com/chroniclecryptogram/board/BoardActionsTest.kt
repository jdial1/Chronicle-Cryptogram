package com.chroniclecryptogram.board

import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.cipher.model.Wallets
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.File

/**
 * The board's rules, tested against a real puzzle with no Android runtime.
 *
 * These cover the mechanic the game is built on -- assigning a letter fills every
 * copy of that glyph -- and the two scarce wallets, which are the only real
 * tension in the game and so the easiest thing to get subtly wrong.
 */
class BoardActionsTest {

    private val puzzle: PuzzleData = run {
        val root = File("../..").canonicalFile
        val text = File(root, "src/data/puzzles.json").readText()
        val all = Json { ignoreUnknownKeys = false }
            .decodeFromString<List<PuzzleData>>(text)
        Edition.morningPuzzleForEdition(all, 1) ?: all.first()
    }

    private fun boardAtFirstCell(): BoardState {
        val state = BoardState.forPuzzle(puzzle)
        return BoardActions.select(state, state.cells.first().cellId)
    }

    @Test
    fun `typing a letter fills every cell showing that glyph`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val occurrences = state.cells.count { it.symbolId == symbolId }

        val typed = BoardActions.type(state, "E")

        assertEquals("E", typed.mappings[symbolId])
        // One mapping entry, but it paints every occurrence -- that is the point.
        assertEquals(1, typed.mappings.size)
        assertTrue(occurrences >= 1)
    }

    @Test
    fun `typing advances the cursor to the next unguessed cell`() {
        val state = boardAtFirstCell()
        val typed = BoardActions.type(state, "E")
        assertNotNull(typed.selectedCellId)
        assertTrue(
            typed.selectedCellId != state.selectedCellId,
            "cursor did not move off the typed cell",
        )
    }

    @Test
    fun `a hint reveals the truth, locks the symbol and costs one hint`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!

        val hinted = BoardActions.hint(state)

        assertEquals(state.answer[symbolId], hinted.mappings[symbolId])
        assertTrue(symbolId in hinted.lockedSymbolIds)
        assertEquals(Wallets.DAILY_HINTS - 1, hinted.hintsRemaining)
    }

    @Test
    fun `a locked symbol cannot be overwritten or cleared`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val hinted = BoardActions.select(BoardActions.hint(state), state.selectedCellId!!)

        val retyped = BoardActions.type(hinted, "Z")
        assertEquals(hinted.answer[symbolId], retyped.mappings[symbolId])

        val erased = BoardActions.backspace(hinted)
        assertEquals(hinted.answer[symbolId], erased.mappings[symbolId])
    }

    @Test
    fun `hints stop at zero rather than going negative`() {
        var state = boardAtFirstCell().copy(hintsRemaining = 0)
        val before = state.mappings
        state = BoardActions.hint(state)
        assertEquals(0, state.hintsRemaining)
        assertEquals(before, state.mappings)
    }

    @Test
    fun `a correct check locks the guess and a wrong one flags it, both costing a check`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val truth = state.answer[symbolId]!!
        val wrong = if (truth == "A") "B" else "A"

        val correct = BoardActions.check(
            BoardActions.select(BoardActions.type(state, truth), state.selectedCellId!!)
        )
        assertTrue(symbolId in correct.verifiedSymbolIds)
        assertFalse(symbolId in correct.flaggedSymbolIds)
        assertEquals(Wallets.DAILY_CHECKS - 1, correct.checksRemaining)

        val incorrect = BoardActions.check(
            BoardActions.select(BoardActions.type(state, wrong), state.selectedCellId)
        )
        assertTrue(symbolId in incorrect.flaggedSymbolIds)
        assertFalse(symbolId in incorrect.verifiedSymbolIds)
        assertEquals(Wallets.DAILY_CHECKS - 1, incorrect.checksRemaining)
    }

    @Test
    fun `correcting a flagged guess clears the flag without spending another check`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val truth = state.answer[symbolId]!!
        val wrong = if (truth == "A") "B" else "A"

        val flagged = BoardActions.check(
            BoardActions.select(BoardActions.type(state, wrong), state.selectedCellId!!)
        )
        assertTrue(symbolId in flagged.flaggedSymbolIds)

        val fixed = BoardActions.type(
            BoardActions.select(flagged, state.selectedCellId),
            truth,
        )
        assertFalse(symbolId in fixed.flaggedSymbolIds)
        assertEquals(flagged.checksRemaining, fixed.checksRemaining)
    }

    @Test
    fun `checking without a guess costs nothing`() {
        val state = boardAtFirstCell()
        val checked = BoardActions.check(state)
        assertEquals(Wallets.DAILY_CHECKS, checked.checksRemaining)
    }

    @Test
    fun `clearing letters keeps locked symbols and drops the rest`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val hinted = BoardActions.hint(state)
        val second = hinted.cells.first { it.symbolId != symbolId }
        val typed = BoardActions.type(BoardActions.select(hinted, second.cellId), "Q")

        val cleared = BoardActions.clearLetters(typed)

        assertEquals(hinted.answer[symbolId], cleared.mappings[symbolId])
        assertFalse(cleared.mappings.containsKey(second.symbolId))
        assertTrue(cleared.flaggedSymbolIds.isEmpty())
    }

    @Test
    fun `filling every symbol correctly solves the puzzle`() {
        var state = BoardState.forPuzzle(puzzle)
        for ((symbolId, letter) in state.answer) {
            val cell = state.cells.first { it.symbolId == symbolId }
            state = BoardActions.type(BoardActions.select(state, cell.cellId), letter)
        }
        assertTrue(state.isSolved, "board should be solved")
    }

    @Test
    fun `one wrong letter leaves the puzzle unsolved`() {
        var state = BoardState.forPuzzle(puzzle)
        val entries = state.answer.entries.toList()
        for ((index, entry) in entries.withIndex()) {
            val cell = state.cells.first { it.symbolId == entry.key }
            val letter = if (index == 0) {
                if (entry.value == "A") "B" else "A"
            } else {
                entry.value
            }
            state = BoardActions.type(BoardActions.select(state, cell.cellId), letter)
        }
        assertFalse(state.isSolved, "one wrong letter must not count as solved")
    }

    @Test
    fun `a restored board recomputes flags rather than trusting the save`() {
        val state = boardAtFirstCell()
        val symbolId = state.selectedSymbolId!!
        val truth = state.answer[symbolId]!!

        // A save claiming a flag on a symbol that is now correct.
        val progress = BoardActions.toProgress(
            BoardActions.type(state, truth).copy(flaggedSymbolIds = setOf(symbolId))
        )
        val restored = BoardActions.restore(BoardState.forPuzzle(puzzle), progress)

        assertFalse(
            symbolId in restored.flaggedSymbolIds,
            "a correct guess must not stay flagged after a reload",
        )
    }
}
