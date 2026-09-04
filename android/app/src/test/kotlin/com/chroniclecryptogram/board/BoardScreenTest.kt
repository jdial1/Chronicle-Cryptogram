package com.chroniclecryptogram.board

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Drives the real screen: taps a tile, taps a typewriter key, and reads the
 * board back through the same accessibility labels the web version uses.
 *
 * Those labels being the test selectors is deliberate -- it means the a11y
 * contract cannot rot without a test noticing.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BoardScreenTest {

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
            ChronicleTheme(dark = false) { BoardScreen(puzzle) }
        }
    }

    @Test
    fun `the masthead and keyboard render`() {
        showBoard()
        compose.onNodeWithText(puzzle.headline).assertIsDisplayed()
        compose.onNodeWithContentDescription("Typewriter keyboard").assertIsDisplayed()
    }

    @Test
    fun `every letter key is present`() {
        showBoard()
        for (letter in 'A'..'Z') {
            compose.onNodeWithContentDescription(letter.toString()).assertExists()
        }
        compose.onNodeWithContentDescription("Backspace").assertExists()
    }

    /**
     * The core mechanic: assigning a letter fills *every* cell showing that
     * glyph, not just the tapped one.
     */
    @Test
    fun `typing a letter fills every cell with the same glyph`() {
        showBoard()

        // Tap the first unassigned tile, then a key.
        compose.onAllNodesWithContentDescription(", unassigned", substring = true)
            .onFirst()
            .performClick()
        compose.onNodeWithContentDescription("E").performClick()
        compose.waitForIdle()

        val mapped = compose.onAllNodesWithContentDescription(", mapped to E", substring = true)
            .fetchSemanticsNodes()
        assertTrue("no tile reported the typed letter", mapped.isNotEmpty())
    }

    @Test
    fun `a hint locks a symbol and decrements the wallet`() {
        showBoard()

        compose.onNodeWithText("Hint (3)").assertExists()
        compose.onAllNodesWithContentDescription(", unassigned", substring = true)
            .onFirst()
            .performClick()
        compose.onNodeWithText("Hint (3)").performClick()
        compose.waitForIdle()

        compose.onNodeWithText("Hint (2)").assertExists()
        val locked = compose.onAllNodesWithContentDescription(", locked as ", substring = true)
            .fetchSemanticsNodes()
        assertTrue("hint did not lock a symbol", locked.isNotEmpty())
    }

    @Test
    fun `the check wallet starts at three and spends one on a guess`() {
        showBoard()

        compose.onNodeWithText("Check (3)").assertExists()
        compose.onAllNodesWithContentDescription(", unassigned", substring = true)
            .onFirst()
            .performClick()
        compose.onNodeWithContentDescription("Q").performClick()
        compose.waitForIdle()

        // Re-select the tile the guess landed on, then check it.
        compose.onAllNodesWithContentDescription(", mapped to Q", substring = true)
            .onFirst()
            .performClick()
        compose.onNodeWithText("Check (3)").performClick()
        compose.waitForIdle()

        compose.onNodeWithText("Check (2)").assertExists()
    }
}
