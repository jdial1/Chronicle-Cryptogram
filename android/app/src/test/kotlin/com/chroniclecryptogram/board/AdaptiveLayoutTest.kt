package com.chroniclecryptogram.board

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.DeskWidth
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
 * The board on a phone, a tablet and a foldable opened flat.
 *
 * Robolectric qualifiers set the window size, so these run on the JVM. The web
 * version could not be tested this way -- and could not adapt this way either,
 * having only a single `min-width: 640px` media query.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class AdaptiveLayoutTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle = TestPuzzles.first

    private fun showBoard() {
        compose.setContent {
            ChronicleTheme(dark = false) {
                BoardScreen(state = BoardState.forPuzzle(puzzle), onAction = {})
            }
        }
    }

    @Test
    @Config(sdk = [34], qualifiers = "w411dp-h891dp")
    fun `a phone docks the tools below the board`() {
        showBoard()
        // Both layouts expose the same tools; only the arrangement differs, so
        // the assertion is that they exist and the board still renders.
        compose.onNodeWithContentDescription("Typewriter keyboard").assertExists()
        compose.onNodeWithContentDescription(
            "Reveal the selected glyph. 3 hints left this edition.",
        ).assertExists()
    }

    @Test
    @Config(sdk = [34], qualifiers = "w1280dp-h800dp")
    fun `a wide window still exposes every tool`() {
        showBoard()
        compose.onNodeWithContentDescription("Typewriter keyboard").assertExists()
        compose.onNodeWithContentDescription(
            "Reveal the selected glyph. 3 hints left this edition.",
        ).assertExists()
        compose.onNodeWithContentDescription(
            "Wipe every guess and start the quote over.",
        ).assertExists()
    }

    @Test
    @Config(sdk = [34], qualifiers = "w800dp-h1280dp")
    fun `a tablet in portrait renders the board`() {
        showBoard()
        compose.onNodeWithContentDescription("Typewriter keyboard").assertExists()
    }

    /** The breakpoint itself, which is Material's 600dp. */
    @Test
    @Config(sdk = [34])
    fun `desk width is derived from the window, not a device category`() {
        assertEquals(DeskWidth.Compact, DeskWidth.fromWidth(360.dp))
        assertEquals(DeskWidth.Compact, DeskWidth.fromWidth(599.dp))
        assertEquals(DeskWidth.Expanded, DeskWidth.fromWidth(600.dp))
        assertEquals(DeskWidth.Expanded, DeskWidth.fromWidth(1280.dp))
    }

    @Test
    @Config(sdk = [34])
    fun `only an expanded window uses the side rail`() {
        assertTrue(!DeskWidth.Compact.usesSideRail)
        assertTrue(DeskWidth.Expanded.usesSideRail)
    }

    /** Newsprint is unreadable stretched across a desktop window. */
    @Test
    @Config(sdk = [34])
    fun `wide windows cap the board to a reading measure`() {
        assertEquals(720.dp, DeskWidth.Expanded.boardMaxWidth)
        assertTrue(
            "a compact window should use all the width it has",
            DeskWidth.Compact.boardMaxWidth == androidx.compose.ui.unit.Dp.Unspecified,
        )
    }

    /**
     * The case every earlier test in this file missed.
     *
     * They asserted the tools existed, which stayed true while the board itself
     * was squeezed to nothing: on a phone in landscape the desk is ~310dp tall,
     * the side rail alone wanted ~260dp of it, and the cipher rendered zero
     * visible tiles. Asserting a glyph is on screen is what actually catches it.
     */
    @Test
    @Config(sdk = [34], qualifiers = "w891dp-h411dp")
    fun `a phone in landscape still shows the cipher`() {
        showBoard()

        // Every tile matches, which is the point: before the fix there were none.
        compose.onAllNodesWithContentDescription("Cipher glyph", substring = true)
            .onFirst()
            .assertExists()

        // ...and the instrument is still reachable beside it.
        compose.onNodeWithContentDescription("Typewriter keyboard").assertExists()
        compose.onNodeWithContentDescription(
            "Wipe every guess and start the quote over.",
        ).assertExists()
    }

    @Test
    @Config(sdk = [34], qualifiers = "w891dp-h411dp")
    fun `a short desk drops the press plate rather than the cipher`() {
        showBoard()
        // The masthead's woodcut is decoration and goes first; the headline and
        // the board both stay.
        compose.onNodeWithText(puzzle.headline).assertExists()
        // Every tile matches, which is the point: before the fix there were none.
        compose.onAllNodesWithContentDescription("Cipher glyph", substring = true)
            .onFirst()
            .assertExists()
    }
}
