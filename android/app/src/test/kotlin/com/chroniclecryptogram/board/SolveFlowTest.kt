package com.chroniclecryptogram.board

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.Solve
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.data.DeskState
import com.chroniclecryptogram.data.DeskStore
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.serialization.json.Json
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

private class FakeStore(initial: DeskState = DeskState()) : DeskStore {
    private val flow = MutableStateFlow(initial)
    override val state: Flow<DeskState> = flow
    override suspend fun update(transform: (DeskState) -> DeskState): DeskState {
        flow.value = transform(flow.value)
        return flow.value
    }
}

/**
 * What happens when a puzzle is solved: the bulletin appears with the player's
 * numbers, and "next edition" walks the season correctly.
 */
@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SolveFlowTest {

    @get:Rule
    val compose = createComposeRule()

    private val dispatcher = StandardTestDispatcher()

    private val puzzles: List<PuzzleData> = run {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/puzzles.json").readText())
    }

    @Before fun setUp() = Dispatchers.setMain(dispatcher)

    @After fun tearDown() = Dispatchers.resetMain()

    private fun solvedBoard(puzzle: PuzzleData): BoardState {
        var state = BoardState.forPuzzle(puzzle)
        for ((symbolId, letter) in state.answer) {
            val cell = state.cells.first { it.symbolId == symbolId }
            state = BoardActions.type(BoardActions.select(state, cell.cellId), letter)
        }
        return state.copy(timerSeconds = 125.3)
    }

    @Test
    fun `the bulletin reports the time, accuracy and hints used`() {
        val puzzle = Edition.morningPuzzleForEdition(puzzles, 1)!!
        compose.setContent {
            ChronicleTheme(dark = false) {
                BoardScreen(state = solvedBoard(puzzle), onAction = {}, onNext = {})
            }
        }

        compose.onNodeWithContentDescription(
            "Solved in 02:05.3, accuracy 100 percent, 0 hints used",
        ).assertExists()
        compose.onNodeWithContentDescription("Share this solve").assertExists()
        compose.onNodeWithContentDescription("Open the next edition").assertExists()
    }

    @Test
    fun `the keyboard is gone once the puzzle is solved`() {
        val puzzle = Edition.morningPuzzleForEdition(puzzles, 1)!!
        compose.setContent {
            ChronicleTheme(dark = false) {
                BoardScreen(state = solvedBoard(puzzle), onAction = {}, onNext = {})
            }
        }
        compose.onNodeWithContentDescription("Typewriter keyboard").assertDoesNotExist()
    }

    /** Solving a Morning unlocks that edition's Night Extra, so that comes next. */
    @Test
    fun `after a morning the night extra comes next`() = runTest(dispatcher) {
        val morning = Edition.morningPuzzleForEdition(puzzles, 1)!!
        val night = Edition.nightPuzzleForEdition(puzzles, 1)!!
        val model = BoardViewModel(
            FakeStore(DeskState(solvedPuzzleIds = listOf(morning.id))),
            puzzles,
            compute = dispatcher,
        )

        assertEquals(night.id, model.nextPuzzle(morning)?.id)
    }

    /** After the Night Extra the season moves on to the next Morning. */
    @Test
    fun `after a night extra the next morning comes next`() = runTest(dispatcher) {
        val morning = Edition.morningPuzzleForEdition(puzzles, 1)!!
        val night = Edition.nightPuzzleForEdition(puzzles, 1)!!
        val model = BoardViewModel(
            FakeStore(DeskState(solvedPuzzleIds = listOf(morning.id, night.id))),
            puzzles,
            compute = dispatcher,
        )

        assertEquals(
            Edition.morningPuzzleForEdition(puzzles, 2)!!.id,
            model.nextPuzzle(night)?.id,
        )
    }

    /** A locked Night Extra is skipped rather than offered. */
    @Test
    fun `an unsolved morning does not offer its night extra`() = runTest(dispatcher) {
        val morning = Edition.morningPuzzleForEdition(puzzles, 1)!!
        val model = BoardViewModel(FakeStore(DeskState()), puzzles, compute = dispatcher)

        assertNull("nothing is unlocked yet", model.nextPuzzle(morning))
    }

    /** The end of the season has nowhere to go. */
    @Test
    fun `the season finale offers nothing further`() = runTest(dispatcher) {
        val last = Edition.maxEdition(puzzles)
        val finale = Edition.nightPuzzleForEdition(puzzles, last)!!
        val model = BoardViewModel(
            FakeStore(DeskState(solvedPuzzleIds = puzzles.map { it.id })),
            puzzles,
            compute = dispatcher,
        )

        assertNull("the season is over", model.nextPuzzle(finale))
    }

    @Test
    fun `the share card quotes the same numbers the bulletin shows`() {
        val puzzle = Edition.morningPuzzleForEdition(puzzles, 1)!!
        val board = solvedBoard(puzzle)
        val text = Solve.shareText(
            puzzle,
            board.timerSeconds,
            Solve.accuracy(board.mappings, board.answer),
            hintsUsed = 0,
        )
        assertEquals(true, text.contains("Time: 02:05.3"))
        assertEquals(true, text.contains("Accuracy: 100%"))
        assertEquals(true, text.contains("EDITION #${puzzle.editionNumber}"))
    }
}
