package com.chroniclecryptogram.archive

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
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

    /**
     * Rows are collapsed until tapped, so every slot assertion has to open its
     * edition first. That is the archive's actual shape now, and a test that
     * skipped the tap would be testing a screen that no longer exists.
     */
    private fun expand(edition: Int) {
        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasTestTag(issueRowTag(edition)))
        compose.onNodeWithTag(issueRowTag(edition)).performClick()
    }

    private fun assertChip(edition: Int, description: String) {
        expand(edition)
        scrollTo(description)
        compose.onNodeWithContentDescription(description).assertExists()
    }

    @Test
    fun `a fresh player sees edition one open and edition two locked`() {
        show()
        assertChip(1, "Morning Edition, Edition No. 1, open")
        assertChip(2, "Morning Edition, Edition No. 2, locked")
    }

    @Test
    fun `the night extra is locked before its morning is solved`() {
        show()
        assertChip(1, "Night Extra, Edition No. 1, locked")
    }

    @Test
    fun `the night extra opens once its own morning is solved`() {
        show(setOf(morning(1).id))
        assertChip(1, "Night Extra, Edition No. 1, open")
    }

    @Test
    fun `solving a morning opens the next edition`() {
        show(setOf(morning(1).id))
        assertChip(1, "Morning Edition, Edition No. 1, decoded")
        assertChip(2, "Morning Edition, Edition No. 2, open")
        assertChip(3, "Morning Edition, Edition No. 3, locked")
    }

    /**
     * Contiguity, the rule that stops a hand-edited save skipping the story:
     * solving 1, 2 and 4 must still stop the front page at 3.
     */
    @Test
    fun `a hole in the run cannot be skipped`() {
        show(setOf(morning(1).id, morning(2).id, morning(4).id))
        assertChip(3, "Morning Edition, Edition No. 3, open")
        assertChip(4, "Morning Edition, Edition No. 4, locked")
    }

    @Test
    fun `a locked issue cannot be opened`() {
        show()
        opened.clear()

        expand(2)
        val locked = "Morning Edition, Edition No. 2, locked"
        scrollTo(locked)
        compose.onNodeWithContentDescription(locked).performClick()

        assertTrue("a locked issue must not open", opened.isEmpty())
    }

    @Test
    fun `an unlocked issue opens the puzzle it names`() {
        show()
        opened.clear()

        expand(1)
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, open").performClick()

        assertEquals(1, opened.size)
        assertEquals(morning(1).id, opened.first().id)
    }

    /** Every issue is listed, locked or not -- including the season finale. */
    @Test
    fun `the last edition in the season is reachable in the list`() {
        show()
        val last = Edition.maxEdition(puzzles)
        assertChip(last, "Morning Edition, Edition No. $last, locked")
    }

    @Test
    fun `rows start collapsed and only one opens at a time`() {
        show()

        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, open")
            .assertDoesNotExist()

        expand(1)
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, open")
            .assertExists()

        // Opening another edition must close the first, or a phone screen fills
        // with expanded rows and the overview is gone again.
        expand(2)
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, open")
            .assertDoesNotExist()
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 2, locked")
            .assertExists()
    }

    @Test
    fun `the list is grouped under its chapter headings`() {
        show()
        // Chapter titles are the landmarks that make thirty editions navigable.
        compose.onNodeWithText(Edition.chapterForEdition(1).title).assertExists()
    }
}
