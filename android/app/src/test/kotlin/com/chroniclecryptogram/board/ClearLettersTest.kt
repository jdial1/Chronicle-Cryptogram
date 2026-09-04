package com.chroniclecryptogram.board

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
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
 * Clearing wipes every guess on the edition. One stray tap on a nearly-solved
 * board would be unrecoverable, so it asks first -- as the web does.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ClearLettersTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle: PuzzleData = run {
        val root = File("../..").canonicalFile
        val all = Json { ignoreUnknownKeys = false }
            .decodeFromString<List<PuzzleData>>(File(root, "src/data/puzzles.json").readText())
        Edition.morningPuzzleForEdition(all, 1)!!
    }

    private lateinit var current: BoardState

    private fun showWithGuess() {
        compose.setContent {
            var state by remember {
                val fresh = BoardState.forPuzzle(puzzle)
                val cell = fresh.cells.first()
                mutableStateOf(BoardActions.type(BoardActions.select(fresh, cell.cellId), "E"))
            }
            current = state
            ChronicleTheme(dark = false) {
                BoardScreen(
                    state = state,
                    onAction = { transition -> state = transition(state); current = state },
                )
            }
        }
    }

    @Test
    fun `clearing asks before wiping the board`() {
        showWithGuess()
        val before = current.mappings
        assertTrue("test setup should have a guess", before.isNotEmpty())

        compose.onNodeWithContentDescription(
            "Wipe every guess and start the quote over.",
        ).performClick()
        compose.waitForIdle()

        assertEquals("the board must not be wiped before confirming", before, current.mappings)
        compose.onNodeWithContentDescription("Keep working").assertExists()
    }

    @Test
    fun `keeping working leaves the board alone`() {
        showWithGuess()
        val before = current.mappings

        compose.onNodeWithContentDescription(
            "Wipe every guess and start the quote over.",
        ).performClick()
        compose.onNodeWithContentDescription("Keep working").performClick()
        compose.waitForIdle()

        assertEquals(before, current.mappings)
    }

    @Test
    fun `confirming wipes the guesses`() {
        showWithGuess()
        assertTrue(current.mappings.isNotEmpty())

        compose.onNodeWithContentDescription(
            "Wipe every guess and start the quote over.",
        ).performClick()
        compose.onNodeWithContentDescription("Confirm clearing every letter").performClick()
        compose.waitForIdle()

        assertTrue("guesses should be gone", current.mappings.isEmpty())
    }
}
