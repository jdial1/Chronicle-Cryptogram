package com.chroniclecryptogram.board

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.PrimerPractice
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * What the bulletin offers after a drill, and after the Primer.
 *
 * The drill has to be legible as a drill. Told "DECODED" and offered "Next
 * edition", a player would reasonably expect the season to have moved on, and
 * it has not: a drill unlocks nothing and counts for nothing, which is the
 * whole point of it.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PracticeUiTest {

    @get:Rule
    val compose = createComposeRule()

    private val primer: PuzzleData = TestPuzzles.all.first { Edition.isPrimerPuzzle(it) }
    private val drill: PuzzleData =
        PrimerPractice.create(TestPuzzles.all, listOf("A DRILL FOR THE DESK"))!!

    private var drills = 0
    private var nexts = 0

    private fun showSolved(puzzle: PuzzleData, offerPractice: Boolean = true) {
        val state = BoardState.forPuzzle(puzzle).let { it.copy(mappings = it.answer, isSolved = true) }
        compose.setContent {
            ChronicleTheme(dark = false) {
                Column {
                    SolveBulletin(
                        state = state,
                        onNext = { nexts++ },
                        onPractice = if (offerPractice) ({ drills++ }) else null,
                    )
                }
            }
        }
    }

    @Test
    fun `a solved drill says so rather than claiming an edition`() {
        showSolved(drill)
        compose.onNodeWithText("DRILL DECODED").assertIsDisplayed()
    }

    @Test
    fun `a solved edition still says decoded`() {
        showSolved(primer)
        compose.onNodeWithText("DECODED").assertIsDisplayed()
    }

    @Test
    fun `a drill offers another drill and no next edition`() {
        showSolved(drill)
        compose.onNodeWithText("Another drill").assertIsDisplayed().performClick()
        assertEquals(1, drills)
        // A drill leads nowhere. Offering "Next edition" from one would imply
        // the season had advanced, and nothing about a drill advances it.
        compose.onNodeWithText("Next edition").assertDoesNotExist()
    }

    @Test
    fun `the Primer offers a first drill alongside the next edition`() {
        showSolved(primer)
        compose.onNodeWithText("Practice drill").assertIsDisplayed().performClick()
        assertEquals(1, drills)
        compose.onNodeWithText("Next edition").assertIsDisplayed().performClick()
        assertEquals(1, nexts)
    }

    @Test
    fun `no drill is offered where the caller has none to give`() {
        showSolved(primer, offerPractice = false)
        compose.onNodeWithText("Practice drill").assertDoesNotExist()
        compose.onNodeWithText("Another drill").assertDoesNotExist()
    }
}
