package com.chroniclecryptogram.board

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.LocalReduceMotion
import kotlinx.serialization.json.Json
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
 * The reduce-motion setting, which describes itself as "Still keys and no letter
 * jitter" and for a long time did neither.
 *
 * There was no letter jitter in the app at all, so half the sentence promised to
 * switch off something that did not exist, and the typewriter's press animation
 * ignored the setting entirely. Someone who turns this on is usually not
 * expressing a preference, so a switch that does nothing is worse than no switch.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ReduceMotionTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle: PuzzleData = run {
        val root = File("../..").canonicalFile
        val all = Json { ignoreUnknownKeys = false }
            .decodeFromString<List<PuzzleData>>(File(root, "src/data/puzzles.json").readText())
        Edition.morningPuzzleForEdition(all, 1) ?: all.first()
    }

    private fun showTypedBoard(reduceMotion: Boolean) {
        var state = BoardState.forPuzzle(puzzle)
        state = BoardActions.select(state, state.cells.first().cellId)
        state = BoardActions.type(state, "E")

        compose.setContent {
            ChronicleTheme(dark = false, reduceMotion = reduceMotion) {
                BoardScreen(state = state, onAction = {})
            }
        }
    }

    @Test
    fun `a stamped letter sits off true, the way a struck key lands`() {
        showTypedBoard(reduceMotion = false)
        // The letter reached the board; the offset itself is a draw-time
        // transform and is asserted through the seed below rather than here.
        compose.onAllNodesWithContentDescription("mapped to E", substring = true)
            .fetchSemanticsNodes()
            .let { assertTrue("expected the typed letter on the board", it.isNotEmpty()) }
    }

    @Test
    fun `the same letter in the same cell always lands the same way`() {
        // Derived from the cell and the letter rather than drawn at random, so
        // it survives recomposition without anywhere to remember it. The web
        // keeps a ref for precisely this reason.
        val first = typewriterJitter("w1_0", "E")
        val again = typewriterJitter("w1_0", "E")
        assertEquals(first, again)
    }

    @Test
    fun `the same letter scatters across a board`() {
        // Two particular cells colliding is fine and will happen; a whole board
        // of the same letter leaning in step would read as a skew rather than as
        // a typewriter. So the property is variety across many cells, not
        // inequality of a chosen pair -- which is what the first version of this
        // test asserted, and it caught a real one -- though not the one it
        // looked like: the seed string had been written with Kotlin's $-escape
        // intact, so every cell was hashing the same literal text.
        val offsets = (0 until 40)
            .map { typewriterJitter("w${it / 6}_${it % 6}", "E") }
            .toSet()

        assertTrue(
            "expected the offsets to scatter, got ${offsets.size} distinct of 40",
            offsets.size >= 36,
        )
    }

    @Test
    fun `the offset stays inside the web's range`() {
        // +/-3 degrees and +/-1px, from `typewriterJitter` in CryptogramGrid.
        for (cell in listOf("w0_0", "w1_1", "w2_2", "w7_4", "w12_0")) {
            for (letter in listOf("A", "E", "T", "Z")) {
                val (rotation, drop) = typewriterJitter(cell, letter)
                assertTrue("rotation $rotation out of range", rotation in -3f..3f)
                assertTrue("drop $drop out of range", drop in -1f..1f)
            }
        }
    }

    @Test
    fun `a key still reports itself when motion is reduced`() {
        showTypedBoard(reduceMotion = true)
        // The travel and the squash go; the control does not.
        compose.onNodeWithContentDescription("Q").assertExists().performClick()
        compose.onNodeWithContentDescription("Backspace").assertExists()
    }

    @Test
    fun `the setting reaches the board through the theme`() {
        var seen: Boolean? = null
        compose.setContent {
            ChronicleTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider {
                    seen = LocalReduceMotion.current
                }
            }
        }
        assertEquals(true, seen)
    }
}
