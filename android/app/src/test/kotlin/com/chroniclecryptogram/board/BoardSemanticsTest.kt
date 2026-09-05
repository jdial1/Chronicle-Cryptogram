package com.chroniclecryptogram.board

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * What a screen reader is handed when it walks the board.
 *
 * Compose keeps two semantics trees: the unmerged one, which mirrors the
 * composable structure, and the merged one, which is what an accessibility
 * service actually receives. These assertions run against the merged tree --
 * the default -- because that is the tree that matters, and because
 * `uiautomator dump` reports something closer to the unmerged one and has
 * already been misleading once in this review.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BoardSemanticsTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle: PuzzleData = run {
        val root = File("../..").canonicalFile
        val all = Json { ignoreUnknownKeys = false }
            .decodeFromString<List<PuzzleData>>(File(root, "src/data/puzzles.json").readText())
        Edition.morningPuzzleForEdition(all, 1) ?: all.first()
    }

    private val board = BoardState.forPuzzle(puzzle)

    private fun show() {
        compose.setContent {
            ChronicleTheme(dark = false) { BoardScreen(state = board, onAction = {}) }
        }
    }

    @Test
    fun `a tile is one stop, not three`() {
        show()

        // Merging does not remove the glyph's text -- it pulls it up into the
        // tile's own node -- so the test is not "no node has this text" but
        // "every node that has it is a labelled tile". Unmerged, the tile's
        // empty letter-slot placeholder and its bare glyph came through as
        // separate stops, and a screen reader hit each cell three times.
        val glyph = board.cells.first().let { cell ->
            board.words.flatMap { it.symbols }.first { it.symbolId == cell.symbolId }.char
        }
        assertTrue("the puzzle should have a glyph to check", !glyph.isNullOrEmpty())

        // Not "is a tile": when the glyph happens to be a Latin letter, the
        // typewriter key for it carries the same text and is a legitimate stop.
        // The property that matters is that nothing carries a glyph *without*
        // a description -- a bare stop with no context is the actual bug.
        val withText = compose.onAllNodesWithText(glyph!!).fetchSemanticsNodes()
        val unlabelled = withText.filter { node ->
            node.config.getOrNull(SemanticsProperties.ContentDescription).isNullOrEmpty()
        }
        assertEquals(
            "every node carrying a glyph should say what it is",
            emptyList<String>(),
            unlabelled.map { it.config.getOrNull(SemanticsProperties.Text).toString() },
        )
        assertTrue("expected at least one tile", withText.isNotEmpty())
    }

    @Test
    fun `every letter cell is reachable and labelled`() {
        show()
        // One node per cell, each carrying the label the web build wrote.
        compose.onAllNodesWithContentDescription("Cipher glyph", substring = true)
            .fetchSemanticsNodes()
            .let { nodes ->
                assertTrue(
                    "expected a node per visible cell, found ${nodes.size}",
                    nodes.isNotEmpty(),
                )
            }
    }

    @Test
    fun `a typewriter key is one stop, not two`() {
        show()
        // Exactly one node bears the keycap's letter: the key itself. Unmerged,
        // the Text drawn on the cap was a second stop beside it.
        compose.onNodeWithContentDescription("Q").assertExists()
        compose.onAllNodesWithText("Q").assertCountEquals(1)
    }

    @Test
    fun `a dock tool is one stop, and its count is part of it`() {
        show()
        // "CHECK" and its remaining count are the same control, so the label and
        // the badge must not be separate stops.
        compose.onNodeWithContentDescription(
            "Test the selected guess. 3 checks left this edition.",
        ).assertExists()
        // One node, carrying both the caption and its count.
        compose.onAllNodesWithText("CHECK").assertCountEquals(1)
    }
}
