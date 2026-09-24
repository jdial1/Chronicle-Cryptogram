package com.chroniclecryptogram.board

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The board's spoken half.
 *
 * Typing one letter fills every copy of that glyph at once -- the game's
 * signature move, and the largest event on the board. The tiles are never
 * focused, by design, so their contentDescriptions are unreachable and this
 * live region is the only thing a screen reader ever hears from the board.
 */
class BoardNoteTest {

    private fun note(prior: Map<String, String>, next: Map<String, String>, copies: Int = 1) =
        boardNote(prior, next, { copies })

    @Test
    fun `a typed letter names the letter and how many marks it filled`() {
        assertEquals("E typed onto 4 marks.", note(emptyMap(), mapOf("s1" to "E"), copies = 4))
    }

    @Test
    fun `a single copy is a mark, not marks`() {
        assertEquals("E typed onto 1 mark.", note(emptyMap(), mapOf("s1" to "E"), copies = 1))
    }

    @Test
    fun `clearing a glyph says what left the board`() {
        assertEquals(
            "E cleared from 3 marks.",
            note(mapOf("s1" to "E"), mapOf("s1" to ""), copies = 3),
        )
    }

    @Test
    fun `no change says nothing`() {
        assertNull(note(mapOf("s1" to "E"), mapOf("s1" to "E")))
    }

    @Test
    fun `emptying the whole board is a wipe`() {
        assertEquals(
            BOARD_WIPED,
            note(mapOf("s1" to "E", "s2" to "T"), mapOf("s1" to "", "s2" to "")),
        )
    }

    /**
     * Several glyphs arriving at once is a cloud merge or restored progress, not
     * a move. Announcing it would narrate a sync mid-solve.
     */
    @Test
    fun `progress arriving from elsewhere is not announced`() {
        assertNull(note(emptyMap(), mapOf("s1" to "E", "s2" to "T")))
    }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BoardAnnouncementTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzle = TestPuzzles.first

    /** Renders the board against mappings and a solved flag the test can move. */
    private fun show(): (Map<String, String>, Boolean) -> Unit {
        val start = BoardState.forPuzzle(puzzle)
        var mappings by mutableStateOf(emptyMap<String, String>())
        var solved by mutableStateOf(false)
        compose.setContent {
            ChronicleTheme(dark = false) {
                CipherBoard(
                    words = start.words,
                    mappings = mappings,
                    selectedCellId = null,
                    selectedSymbolId = null,
                    lockedSymbolIds = emptySet(),
                    flaggedSymbolIds = emptySet(),
                    solved = solved,
                    onCellClick = { _, _ -> },
                )
            }
        }
        return { next, isSolved -> mappings = next; solved = isSolved }
    }

    private fun assertAnnounced(text: String) {
        val node = compose.onNodeWithContentDescription(text)
        node.assertExists()
        assertEquals(
            LiveRegionMode.Polite,
            node.fetchSemanticsNode().config.getOrNull(SemanticsProperties.LiveRegion),
        )
    }

    @Test
    fun `filling a glyph is announced as one event`() {
        val set = show()
        val symbolId = BoardState.forPuzzle(puzzle).cells.first().symbolId
        val copies = BoardState.forPuzzle(puzzle).words
            .flatMap { it.symbols }
            .count { !it.isPunctuation && it.symbolId == symbolId }

        set(mapOf(symbolId to "E"), false)
        compose.waitForIdle()

        assertAnnounced("E typed onto ${if (copies == 1) "1 mark" else "$copies marks"}.")
    }

    /**
     * The board arrives blank and stays quiet until the player does something.
     * Announcing on first composition would talk over the edition's headline.
     */
    @Test
    fun `a board says nothing until it is played`() {
        show()
        compose.waitForIdle()
        compose.onNodeWithContentDescription("typed onto", substring = true).assertDoesNotExist()
    }

    @Test
    fun `the solve is announced, and not as just another letter`() {
        val set = show()
        val symbolId = BoardState.forPuzzle(puzzle).cells.first().symbolId

        set(mapOf(symbolId to "E"), false)
        compose.waitForIdle()
        set(mapOf(symbolId to "E"), true)
        compose.waitForIdle()

        assertAnnounced(BOARD_DECODED)
    }
}
