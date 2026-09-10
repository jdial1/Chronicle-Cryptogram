package com.chroniclecryptogram.board

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Selecting a glyph lights up every cell showing it.
 *
 * This is how a cryptogram is actually solved: you pick a glyph *because* you
 * can see where it recurs, and the pattern of recurrence is the evidence. The
 * board highlighted only the tapped tile, which threw that away and left the
 * player counting glyphs by eye across forty cells.
 *
 * The fill is a colour, which a semantics test cannot read. What it can read is
 * the caret: exactly one cell says "selected", so the test pins the half that
 * would otherwise regress silently -- a highlight applied to every cell at once,
 * or to none.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class GlyphHighlightTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle = TestPuzzles.first
    private val board = BoardState.forPuzzle(puzzle)

    /** A glyph that appears on more than one cell, which is the case that matters. */
    private val repeated = board.cells
        .groupingBy { it.symbolId }
        .eachCount()
        .entries
        .first { it.value > 1 }
        .key

    private fun show() {
        compose.setContent {
            // Compose state, not a plain var: a reassignment the runtime cannot
            // see recomposes nothing, and the tap would appear to do nothing.
            var state by remember { mutableStateOf(board) }
            ChronicleTheme(dark = false) {
                BoardScreen(
                    state = state,
                    onAction = { transform -> state = transform(state) },
                )
            }
        }
    }

    @Test
    fun `the caret sits on exactly one cell`() {
        val selected = BoardActions.select(board, board.cells.first().cellId)
        compose.setContent {
            ChronicleTheme(dark = false) { BoardScreen(state = selected, onAction = {}) }
        }

        val carets = compose
            .onAllNodesWithContentDescription(", selected", substring = true)
            .fetchSemanticsNodes()
        assertEquals("the caret must be on one cell only", 1, carets.size)
    }

    @Test
    fun `nothing is selected on a fresh board`() {
        compose.setContent {
            ChronicleTheme(dark = false) { BoardScreen(state = board, onAction = {}) }
        }
        compose
            .onAllNodesWithContentDescription(", selected", substring = true)
            .fetchSemanticsNodes()
            .let { assertTrue("a fresh board has no caret", it.isEmpty()) }
    }

    @Test
    fun `selecting a cell selects its glyph, not just that cell`() {
        // The state layer is what the highlight reads from: every cell whose
        // symbolId matches lights up, so this is the property that decides how
        // many tiles change.
        val cell = board.cells.first { it.symbolId == repeated }
        val selected = BoardActions.select(board, cell.cellId)

        assertEquals(repeated, selected.selectedSymbolId)
        val sharing = board.cells.count { it.symbolId == repeated }
        assertTrue("expected a glyph that recurs, got $sharing cell(s)", sharing > 1)
    }

    @Test
    fun `tapping a tile moves the caret to it`() {
        show()
        val cell = board.cells.first { it.symbolId == repeated }
        val glyph = board.words.flatMap { it.symbols }
            .first { it.symbolId == cell.symbolId }.char.orEmpty()

        compose.onAllNodesWithContentDescription("Cipher glyph $glyph", substring = true)[0]
            .performClick()
        compose.onNodeWithContentDescription(", selected", substring = true).assertIsDisplayed()
    }
}
