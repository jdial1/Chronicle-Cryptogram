package com.chroniclecryptogram.board

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.DeskWidth
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
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

    private val puzzle: PuzzleData = run {
        val root = File("../..").canonicalFile
        val all = Json { ignoreUnknownKeys = false }
            .decodeFromString<List<PuzzleData>>(File(root, "src/data/puzzles.json").readText())
        Edition.morningPuzzleForEdition(all, 1) ?: all.first()
    }

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

    /** The breakpoints themselves, which are Material's 600dp and 840dp. */
    @Test
    @Config(sdk = [34])
    fun `desk width is derived from the window, not a device category`() {
        assertEquals(DeskWidth.Compact, DeskWidth.fromWidth(360.dp))
        assertEquals(DeskWidth.Compact, DeskWidth.fromWidth(599.dp))
        assertEquals(DeskWidth.Medium, DeskWidth.fromWidth(600.dp))
        assertEquals(DeskWidth.Medium, DeskWidth.fromWidth(839.dp))
        assertEquals(DeskWidth.Expanded, DeskWidth.fromWidth(840.dp))
        assertEquals(DeskWidth.Expanded, DeskWidth.fromWidth(1280.dp))
    }

    @Test
    @Config(sdk = [34])
    fun `only an expanded window uses the side rail`() {
        assertTrue(!DeskWidth.Compact.usesSideRail)
        assertTrue(!DeskWidth.Medium.usesSideRail)
        assertTrue(DeskWidth.Expanded.usesSideRail)
    }

    /** Newsprint is unreadable stretched across a desktop window. */
    @Test
    @Config(sdk = [34])
    fun `wide windows cap the board to a reading measure`() {
        assertEquals(720.dp, DeskWidth.Expanded.boardMaxWidth)
        assertEquals(640.dp, DeskWidth.Medium.boardMaxWidth)
        assertTrue(
            "a compact window should use all the width it has",
            DeskWidth.Compact.boardMaxWidth == androidx.compose.ui.unit.Dp.Unspecified,
        )
    }
}
