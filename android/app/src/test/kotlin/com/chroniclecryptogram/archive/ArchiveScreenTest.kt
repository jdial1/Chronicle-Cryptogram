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
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertContentDescriptionContains
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.PrimerPractice
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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
     * edition first. Only an unlocked row opens: a locked one has nothing
     * behind it but the headline of an edition the player has not reached.
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
    fun `a fresh player sees edition one open`() {
        show()
        assertChip(1, "Morning Edition, Edition No. 1, open")
    }

    @Test
    fun `a locked edition does not expand`() {
        show()
        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasTestTag(issueRowTag(2)))
        compose.onNodeWithTag(issueRowTag(2)).performClick()

        // Nothing behind it: the slot card carries the edition's headline, and
        // an edition the player has not reached should not show one.
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 2, locked")
            .assertDoesNotExist()
    }

    @Test
    fun `a locked row announces itself as locked and not as collapsed`() {
        show()
        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasTestTag(issueRowTag(2)))

        val said = compose.onNodeWithTag(issueRowTag(2))
            .fetchSemanticsNode()
            .config[SemanticsProperties.ContentDescription]
            .joinToString(" ")

        assertTrue("a locked row should say so: $said", said.contains("locked"))
        // "Collapsed" promises something opens, and nothing here does.
        assertFalse("a locked row must not claim a state it cannot be in: $said",
            said.contains("collapsed") || said.contains("expanded"))
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
    }

    /**
     * Contiguity, the rule that stops a hand-edited save skipping the story:
     * solving 1, 2 and 4 must still stop the front page at 3.
     */
    @Test
    fun `a hole in the run cannot be skipped`() {
        show(setOf(morning(1).id, morning(2).id, morning(4).id))
        assertChip(3, "Morning Edition, Edition No. 3, open")
        // 4 is solved in the save but still behind 3, so it stays shut.
        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasTestTag(issueRowTag(4)))
        compose.onNodeWithTag(issueRowTag(4))
            .assertContentDescriptionContains("locked", substring = true)
    }

    @Test
    fun `a locked issue cannot be opened`() {
        show()
        opened.clear()

        compose.onNodeWithTag(ArchiveListTag)
            .performScrollToNode(hasTestTag(issueRowTag(2)))
        compose.onNodeWithTag(issueRowTag(2)).performClick()

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

    /**
     * A chapter with nothing reachable in it collapses to its heading.
     *
     * Thirty locked rows tell a new player how long the season is and nothing
     * else; the heading and a count say the same thing without listing it.
     */
    @Test
    fun `a fully locked chapter shows a count instead of its editions`() {
        show()
        val later = Edition.chapterForEdition(Edition.maxEdition(puzzles))
        val editions = (later.from..later.to).count { edition ->
            Edition.morningPuzzleForEdition(puzzles, edition) != null
        }

        scrollTo("${later.title}, locked, $editions editions")
        compose.onNodeWithContentDescription("${later.title}, locked, $editions editions")
            .assertExists()
        // Its rows are not in the list at all.
        compose.onNodeWithTag(issueRowTag(later.from)).assertDoesNotExist()
    }

    @Test
    fun `the chapter in play lists its editions`() {
        show()
        compose.onNodeWithTag(issueRowTag(1)).assertExists()
    }

    @Test
    fun `rows start collapsed and only one opens at a time`() {
        show(setOf(morning(1).id))

        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, decoded")
            .assertDoesNotExist()

        expand(1)
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, decoded")
            .assertExists()

        // Opening another edition must close the first, or a phone screen fills
        // with expanded rows and the overview is gone again.
        expand(2)
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 1, decoded")
            .assertDoesNotExist()
        compose.onNodeWithContentDescription("Morning Edition, Edition No. 2, open")
            .assertExists()
    }

    @Test
    fun `the list is grouped under its chapter headings`() {
        show()
        // Chapter titles are the landmarks that make thirty editions navigable.
        compose.onNodeWithText(Edition.chapterForEdition(1).title).assertExists()
    }

    @Test
    fun `the Primer offers a practice drill where other editions have a Night Extra`() {
        val primer = puzzles.first { Edition.isPrimerPuzzle(it) }
        show(setOf(primer.id))

        compose.onNodeWithTag(issueRowTag(0)).performClick()
        compose.onNodeWithText("PRACTICE DRILL").assertIsDisplayed()
        // The Primer has no evening slot to fill, which is why the drill can
        // take it without displacing anything.
        compose.onNodeWithText("NIGHT EXTRA").assertDoesNotExist()
    }

    @Test
    fun `the drill is locked until the Primer itself is decoded`() {
        show(emptySet())

        compose.onNodeWithTag(issueRowTag(0)).performClick()
        compose.onNodeWithText("Decode the Primer to unlock.").assertIsDisplayed()
    }

    @Test
    fun `opening the drill slot hands back the practice card, not the Primer`() {
        val primer = puzzles.first { Edition.isPrimerPuzzle(it) }
        show(setOf(primer.id))

        compose.onNodeWithTag(issueRowTag(0)).performClick()
        compose.onNodeWithText("PRACTICE DRILL").performClick()

        // The card is a placeholder the caller swaps for a freshly minted drill.
        // Handing back the Primer's own record here would reopen the Primer.
        assertEquals(1, opened.size)
        assertEquals(PrimerPractice.SLOT_ID, opened.last().id)
    }
}
