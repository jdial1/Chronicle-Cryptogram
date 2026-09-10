package com.chroniclecryptogram.board

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import com.chroniclecryptogram.cipher.Edition
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
 * A finished board is a printed page.
 *
 * The cipher was scaffolding: once it is broken, leaving the glyphs under the
 * answer keeps the reader decoding a sentence they have already solved. The
 * stamp is what says the page is closed.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DecodedStampTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle = Edition.morningPuzzleForEdition(TestPuzzles.all, 1)!!
    private val open = BoardState.forPuzzle(puzzle)
    private val done = open.copy(mappings = open.answer, isSolved = true)

    private fun show(state: BoardState) {
        compose.setContent {
            ChronicleTheme(dark = false) { BoardScreen(state = state, onAction = {}) }
        }
    }

    @Test
    fun `an open board announces its glyphs`() {
        show(open)
        assertTrue(
            compose.onAllNodesWithContentDescription("Cipher glyph", substring = true)
                .fetchSemanticsNodes().isNotEmpty(),
        )
    }

    @Test
    fun `a solved board has no glyphs left to read`() {
        show(done)
        assertEquals(
            "a solved board should print letters, not cipher",
            0,
            compose.onAllNodesWithContentDescription("Cipher glyph", substring = true)
                .fetchSemanticsNodes().size,
        )
    }

    @Test
    fun `an open board is not stamped`() {
        // setContent takes one composition per test, so the two halves of this
        // are two tests rather than a before and after.
        show(open)
        compose.onNodeWithContentDescription("Solved").assertDoesNotExist()
    }

    @Test
    fun `a solved board is stamped`() {
        show(done)
        compose.onNodeWithContentDescription("Solved").assertExists()
    }

    @Test
    fun `a puzzle's stamp always lands in the same place`() {
        // The web re-rolls the position on mount, which is fine for a page that
        // unmounts. Here a recomposition would jump the stamp across the board.
        assertEquals(stampPose(puzzle.id), stampPose(puzzle.id))
    }

    @Test
    fun `different editions are stamped differently`() {
        val poses = TestPuzzles.all.take(20).map { stampPose(it.id) }.toSet()
        assertTrue(
            "expected the stamp to move between editions, got ${poses.size} of 20",
            poses.size >= 15,
        )
    }

    @Test
    fun `the stamp stays inside the web's ranges`() {
        // 24-76% across, 26-74% down, tilted 10-24 degrees either way.
        for (p in TestPuzzles.all) {
            val pose = stampPose(p.id)
            assertTrue("x ${pose.x} out of range", pose.x in 0.24f..0.76f)
            assertTrue("y ${pose.y} out of range", pose.y in 0.26f..0.74f)
            assertTrue(
                "rotation ${pose.rotation} out of range",
                kotlin.math.abs(pose.rotation) in 10f..24f,
            )
        }
    }
}
