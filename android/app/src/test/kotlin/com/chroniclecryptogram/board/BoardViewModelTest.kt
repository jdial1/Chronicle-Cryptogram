package com.chroniclecryptogram.board

import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.cipher.model.Wallets
import com.chroniclecryptogram.data.DeskState
import com.chroniclecryptogram.data.DeskStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.io.File

/** An in-memory [DeskStore], so persistence is exercised without a filesystem. */
private class FakeDeskStore(initial: DeskState = DeskState()) : DeskStore {
    private val flow = MutableStateFlow(initial)
    override val state: Flow<DeskState> = flow
    var writes = 0
        private set

    override suspend fun update(transform: (DeskState) -> DeskState): DeskState {
        writes++
        flow.value = transform(flow.value)
        return flow.value
    }

    fun current(): DeskState = flow.value
}

@OptIn(ExperimentalCoroutinesApi::class)
class BoardViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private val now = 1_700_000_000_000L

    private val puzzles: List<PuzzleData> = run {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/puzzles.json").readText())
    }

    @BeforeEach fun setUp() = Dispatchers.setMain(dispatcher)

    @AfterEach fun tearDown() = Dispatchers.resetMain()

    private fun viewModel(store: DeskStore) = BoardViewModel(store, puzzles) { now }

    @Test
    fun `a fresh desk opens the primer`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val model = viewModel(store)
        model.open()
        dispatcher.scheduler.advanceUntilIdle()

        val state = model.state.value
        assertNotNull(state)
        assertTrue(Edition.isPrimerPuzzle(state!!.puzzle), "expected the primer first")
    }

    @Test
    fun `once the primer is solved the front page opens`() = runTest(dispatcher) {
        val primer = puzzles.first { Edition.isPrimerPuzzle(it) }
        val store = FakeDeskStore(DeskState(solvedPuzzleIds = listOf(primer.id)))
        val model = viewModel(store)
        model.open()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(1, model.state.value?.puzzle?.editionNumber)
    }

    @Test
    fun `typing persists and survives a reload`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val first = viewModel(store)
        first.open()
        dispatcher.scheduler.advanceUntilIdle()

        val cellId = first.state.value!!.cells.first().cellId
        first.act { BoardActions.select(it, cellId) }
        first.act { BoardActions.type(it, "E") }
        dispatcher.scheduler.advanceUntilIdle()

        val symbolId = first.state.value!!.cells.first().symbolId
        assertEquals("E", first.state.value!!.mappings[symbolId])

        // A new view model over the same store, as after a process death.
        val second = viewModel(store)
        second.open()
        dispatcher.scheduler.advanceUntilIdle()
        assertEquals("E", second.state.value!!.mappings[symbolId], "guess did not survive reload")
    }

    @Test
    fun `a spent hint survives a reload`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val first = viewModel(store)
        first.open()
        dispatcher.scheduler.advanceUntilIdle()

        first.act { BoardActions.select(it, first.state.value!!.cells.first().cellId) }
        first.act { BoardActions.hint(it) }
        dispatcher.scheduler.advanceUntilIdle()
        assertEquals(Wallets.DAILY_HINTS - 1, first.state.value!!.hintsRemaining)

        val second = viewModel(store)
        second.open()
        dispatcher.scheduler.advanceUntilIdle()
        assertEquals(
            Wallets.DAILY_HINTS - 1,
            second.state.value!!.hintsRemaining,
            "the hint wallet must not refill on reload",
        )
    }

    @Test
    fun `solving records the puzzle exactly once`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val model = viewModel(store)
        model.open()
        dispatcher.scheduler.advanceUntilIdle()

        val state = model.state.value!!
        for ((symbolId, letter) in state.answer) {
            val cell = state.cells.first { it.symbolId == symbolId }
            model.act { BoardActions.select(it, cell.cellId) }
            model.act { BoardActions.type(it, letter) }
        }
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(model.state.value!!.isSolved, "board should be solved")
        assertEquals(1, store.current().solvedPuzzleIds.size)
        assertEquals(1, store.current().stats.puzzlesSolved)

        // Typing again after the solve must not record a second one.
        model.act { BoardActions.select(it, state.cells.first().cellId) }
        model.act { BoardActions.type(it, "Z") }
        dispatcher.scheduler.advanceUntilIdle()
        assertEquals(1, store.current().stats.puzzlesSolved, "solve was counted twice")
    }

    @Test
    fun `a transition that changes nothing does not write`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val model = viewModel(store)
        model.open()
        dispatcher.scheduler.advanceUntilIdle()
        val before = store.writes

        // No cell selected, so typing is a no-op and must not touch the store.
        model.act { BoardActions.type(it, "E") }
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(before, store.writes, "a no-op transition should not persist")
    }

    @Test
    fun `flags are recomputed on reload rather than trusted`() = runTest(dispatcher) {
        val store = FakeDeskStore()
        val first = viewModel(store)
        first.open()
        dispatcher.scheduler.advanceUntilIdle()

        val state = first.state.value!!
        val cell = state.cells.first()
        val truth = state.answer.getValue(cell.symbolId)
        val wrong = if (truth == "A") "B" else "A"

        first.act { BoardActions.select(it, cell.cellId) }
        first.act { BoardActions.type(it, wrong) }
        first.act { BoardActions.select(it, cell.cellId) }
        first.act { BoardActions.check(it) }
        dispatcher.scheduler.advanceUntilIdle()
        assertTrue(cell.symbolId in first.state.value!!.flaggedSymbolIds)

        // Correct it, then reload: the stale flag must not come back.
        first.act { BoardActions.select(it, cell.cellId) }
        first.act { BoardActions.type(it, truth) }
        dispatcher.scheduler.advanceUntilIdle()

        val second = viewModel(store)
        second.open()
        dispatcher.scheduler.advanceUntilIdle()
        assertFalse(
            cell.symbolId in second.state.value!!.flaggedSymbolIds,
            "a corrected guess must not reload as flagged",
        )
    }
}
