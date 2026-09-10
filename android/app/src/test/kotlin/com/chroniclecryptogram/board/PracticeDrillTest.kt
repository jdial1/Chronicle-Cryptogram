package com.chroniclecryptogram.board

import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.Wallets
import com.chroniclecryptogram.data.DeskState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

/**
 * Practice drills, and the four things a drill must not touch.
 *
 * A drill is a throwaway: it is not an edition, it unlocks nothing, and a
 * player can run as many as they like. That makes every persistence path a
 * place it could do damage -- a drill counted as a solve would push the
 * campaign total past the season's own length, and a drill saved by id would
 * leave a dead board in the desk file for every one ever started.
 *
 * The web excludes drills at six call sites and none of them are enforced by
 * anything. These are the Android equivalents, enforced.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class PracticeDrillTest {

    private val dispatcher = StandardTestDispatcher()
    private val now = 1_700_000_000_000L
    private val puzzles = TestPuzzles.all
    private val pool = listOf("A DRILL FOR THE DESK", "ANOTHER DRILL ENTIRELY")

    @BeforeEach fun setUp() = Dispatchers.setMain(dispatcher)

    @AfterEach fun tearDown() = Dispatchers.resetMain()

    private fun viewModel(store: FakeDeskStore) =
        BoardViewModel(store, puzzles, { now }, dispatcher)

    /** Types the whole answer in, which is what makes the board solved. */
    private fun solve(model: BoardViewModel) {
        val state = model.state.value!!
        for ((symbolId, letter) in state.answer) {
            val cell = state.cells.first { it.symbolId == symbolId }
            model.act { BoardActions.select(it, cell.cellId) }
            model.act { BoardActions.type(it, letter) }
        }
        dispatcher.scheduler.advanceUntilIdle()
    }

    @Test
    fun `starting a drill opens a practice board`() = runTest(dispatcher) {
        val model = viewModel(FakeDeskStore())
        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()

        val state = model.state.value!!
        assertTrue(Edition.isPracticePuzzle(state.puzzle))
        assertTrue(state.puzzle.originalText in pool)
    }

    @Test
    fun `solving a drill does not count toward the campaign`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val model = viewModel(store)
        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()
        solve(model)

        assertTrue(model.state.value!!.isSolved, "the drill should still solve")
        assertEquals(
            emptyList<String>(),
            store.current().solvedPuzzleIds,
            "a drill must not enter the solved list -- it would inflate the campaign count",
        )
        assertEquals(0, store.current().stats.puzzlesSolved)
    }

    @Test
    fun `a drill leaves no board behind in the desk`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val model = viewModel(store)
        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()

        val state = model.state.value!!
        val cell = state.cells.first()
        model.act { BoardActions.select(it, cell.cellId) }
        model.act { BoardActions.type(it, "E") }
        dispatcher.scheduler.advanceUntilIdle()

        // Every drill has a fresh id, so saving one would grow the file forever.
        assertEquals(
            emptyMap<String, Any>(),
            store.current().progress,
            "a drill must not be saved by id",
        )
    }

    @Test
    fun `a drill spends the Primer's hint wallet rather than minting its own`() =
        runTest(dispatcher) {
            val store = FakeDeskStore()
            val model = viewModel(store)
            model.startPractice(pool)
            dispatcher.scheduler.advanceUntilIdle()

            val before = model.state.value!!.hintsRemaining
            assertEquals(Wallets.DAILY_HINTS, before)

            model.act { BoardActions.select(it, model.state.value!!.cells.first().cellId) }
            model.act(BoardActions::hint)
            dispatcher.scheduler.advanceUntilIdle()

            // Otherwise drills would be an unlimited supply of hints for the
            // Primer, which shares their edition number.
            assertEquals(before - 1, model.state.value!!.hintsRemaining)
            assertTrue(store.current().hints.isNotEmpty(), "the wallet spend must persist")
        }

    @Test
    fun `another drill does not hand back the quote just solved`() = runTest(dispatcher) {
        val model = viewModel(FakeDeskStore())
        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()
        val first = model.state.value!!.puzzle.originalText

        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()
        assertNotEquals(first, model.state.value!!.puzzle.originalText)
    }

    @Test
    fun `an existing campaign is untouched by running drills`() = runTest(dispatcher) {
        val primer = puzzles.first { Edition.isPrimerPuzzle(it) }
        val store = FakeDeskStore(DeskState(solvedPuzzleIds = listOf(primer.id)))
        val model = viewModel(store)

        model.startPractice(pool)
        dispatcher.scheduler.advanceUntilIdle()
        solve(model)

        assertEquals(listOf(primer.id), store.current().solvedPuzzleIds)
    }
}
