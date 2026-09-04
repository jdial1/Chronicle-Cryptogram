package com.chroniclecryptogram.archive

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
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
 * The archive's only real job is showing lock state correctly, and getting that
 * wrong either spoils the story or walls the player out of it.
 *
 * The list is a LazyColumn, so an off-screen row genuinely does not exist in the
 * tree: every assertion about a later edition has to scroll to it first.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ArchiveScreenTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzles: List<PuzzleData> = run {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/puzzles.json").readText())
    }

    private val opened = mutableListOf<PuzzleData>()
    private var solved by mutableStateOf(emptySet<String>())

    /** One composition; solve state is state so tests can change it and re-read. */
    private fun show(initial: Set<String> = emptySet()) {
        solved = initial
        compose.setContent {
            val current = solved
            ChronicleTheme(dark = false) {
                ArchiveScreen(
                    puzzles = puzzles,
                    solvedPuzzleIds = current,
                    onOpen = { opened += it },
                )
            }
        }
    }

    private fun morning(edition: Int) = Edition.morningPuzzleForEdition(puzzles, edition)!!

    /** Brings a row into composition, since off-screen rows are not in the tree. */
    private fun scrollTo(description: String) {
        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasContentDescription(description))
    }

    private fun assertChip(description: String) {
        scrollTo(description)
        compose.onNodeWithContentDescription(description).assertExists()
    }

    @Test
    fun `a fresh player sees edition one open and edition two locked`() {
        show()
        assertChip("Morning, Edition No. 1, open")
        assertChip("Morning, Edition No. 2, locked")
    }

    @Test
    fun `the night extra is locked before its morning is solved`() {
        show()
        assertChip("Night Extra, Edition No. 1, locked")
    }

    @Test
    fun `the night extra opens once its own morning is solved`() {
        show(setOf(morning(1).id))
        assertChip("Night Extra, Edition No. 1, open")
    }

    @Test
    fun `solving a morning opens the next edition`() {
        show(setOf(morning(1).id))
        assertChip("Morning, Edition No. 1, decoded")
        assertChip("Morning, Edition No. 2, open")
        assertChip("Morning, Edition No. 3, locked")
    }

    /**
     * Contiguity, the rule that stops a hand-edited save skipping the story:
     * solving 1, 2 and 4 must still stop the front page at 3.
     */
    @Test
    fun `a hole in the run cannot be skipped`() {
        show(setOf(morning(1).id, morning(2).id, morning(4).id))
        assertChip("Morning, Edition No. 3, open")
        assertChip("Morning, Edition No. 4, locked")
    }

    @Test
    fun `a locked issue cannot be opened`() {
        show()
        opened.clear()

        scrollTo("Morning, Edition No. 2, locked")
        compose.onNodeWithContentDescription("Morning, Edition No. 2, locked").performClick()

        assertTrue("a locked issue must not open", opened.isEmpty())
    }

    @Test
    fun `an unlocked issue opens the puzzle it names`() {
        show()
        opened.clear()

        compose.onNodeWithContentDescription("Morning, Edition No. 1, open").performClick()

        assertEquals(1, opened.size)
        assertEquals(morning(1).id, opened.first().id)
    }

    /** Every issue is listed, locked or not -- including the season finale. */
    @Test
    fun `the last edition in the season is reachable in the list`() {
        show()
        val last = Edition.maxEdition(puzzles)
        assertChip("Morning, Edition No. $last, locked")
    }
}
