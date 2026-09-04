package com.chroniclecryptogram.board

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.data.DeskActions
import com.chroniclecryptogram.data.DeskState
import com.chroniclecryptogram.data.DeskStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch

/**
 * Holds one [BoardState] and persists it.
 *
 * All the rules live in [BoardActions] and [DeskActions] as pure functions, so
 * this is only plumbing: apply a transition, then write the result. That split
 * is what lets the game's behaviour be tested without an Android runtime.
 */
class BoardViewModel(
    private val store: DeskStore,
    private val puzzles: List<PuzzleData>,
    private val now: () -> Long = System::currentTimeMillis,
    /** Injected so tests can drive the board build on their own scheduler. */
    private val compute: CoroutineDispatcher = Dispatchers.Default,
) : ViewModel() {

    private val _state = MutableStateFlow<BoardState?>(null)
    val state: StateFlow<BoardState?> = _state.asStateFlow()

    /**
     * Opens the edition the player has actually reached.
     *
     * The Primer comes first if unsolved; otherwise the front page, which is one
     * past the last contiguously solved morning. A hole cannot be skipped.
     */
    fun open(puzzle: PuzzleData? = null) {
        viewModelScope.launch {
            val desk = store.state.first()
            val target = puzzle ?: bootPuzzle(desk)

            // viewModelScope is Dispatchers.Main.immediate, and building a board
            // means a seeded Fisher-Yates over 54 glyphs plus a full parse of the
            // quote. On the main thread that is hundreds of dropped frames --
            // measured, not guessed: "Skipped 473 frames" on first launch.
            val saved = DeskActions.progressFor(desk, target.id)

            val restored = withContext(compute) {
                val fresh = BoardState.forPuzzle(target)
                val board = if (saved != null) BoardActions.restore(fresh, saved) else fresh

                // Wallets are per-edition and shared by the morning and night
                // extra, so they are reconciled against every board in the
                // edition rather than read from this puzzle alone.
                val editionPuzzles = puzzles.map { it.id to it.editionNumber }
                board.copy(
                    hintsRemaining = DeskActions
                        .reconcileHints(desk, target.editionNumber, editionPuzzles).remaining,
                    checksRemaining = DeskActions
                        .reconcileChecks(desk, target.editionNumber, editionPuzzles).remaining,
                )
            }

            _state.value = restored
            if (saved == null) {
                store.update { DeskActions.recordStart(it, now()) }
            }
        }
    }

    private fun bootPuzzle(desk: DeskState): PuzzleData {
        val primer = puzzles.firstOrNull { Edition.isPrimerPuzzle(it) }
        if (primer != null && primer.id !in desk.solvedPuzzleIds) return primer
        return Edition.currentMorningPuzzle(puzzles, desk.solvedPuzzleIds) ?: puzzles.first()
    }

    /**
     * The next thing to open after a solve: the Night Extra of the same edition
     * if it just became unlocked, else the next Morning, else nothing because the
     * season is over.
     *
     * The web wrapped a modulo index into a date-filtered array; progression
     * gating makes this a straight walk.
     */
    suspend fun nextPuzzle(after: PuzzleData): PuzzleData? {
        val solved = store.state.first().solvedPuzzleIds
        if (Edition.isMorningEdition(after)) {
            val night = Edition.nightPuzzleForEdition(puzzles, after.editionNumber)
            if (night != null && Edition.isNightUnlocked(puzzles, solved, after.editionNumber)) {
                return night
            }
        }
        val nextEdition = after.editionNumber + 1
        if (nextEdition > Edition.frontPageEdition(puzzles, solved)) return null
        return Edition.morningPuzzleForEdition(puzzles, nextEdition)
    }

    /** Opens whatever [nextPuzzle] finds, or stays put at the end of the season. */
    fun advance() {
        viewModelScope.launch {
            val current = _state.value?.puzzle ?: return@launch
            nextPuzzle(current)?.let { open(it) }
        }
    }

    /** Applies a transition and persists the result. */
    fun act(transition: (BoardState) -> BoardState) {
        val current = _state.value ?: return
        val next = transition(current)
        if (next === current) return
        _state.value = next
        persist(next, wasSolved = current.isSolved)
    }

    private fun persist(state: BoardState, wasSolved: Boolean) {
        viewModelScope.launch {
            store.update { desk ->
                var updated = DeskActions.saveProgress(
                    desk,
                    state.puzzle.id,
                    BoardActions.toProgress(state),
                    now(),
                )
                updated = DeskActions.saveHintWallet(
                    updated,
                    com.chroniclecryptogram.cipher.Merge.clipDailyWallet(
                        state.puzzle.editionNumber,
                        (com.chroniclecryptogram.cipher.model.Wallets.DAILY_HINTS - state.hintsRemaining).toDouble(),
                    ),
                    now(),
                )
                updated = DeskActions.saveCheckWallet(
                    updated,
                    com.chroniclecryptogram.cipher.Merge.clipDailyWallet(
                        state.puzzle.editionNumber,
                        (com.chroniclecryptogram.cipher.model.Wallets.DAILY_CHECKS - state.checksRemaining).toDouble(),
                        com.chroniclecryptogram.cipher.model.Wallets.DAILY_CHECKS,
                    ),
                    now(),
                )
                // Only on the transition into solved, so reopening a finished
                // puzzle cannot pad the campaign count or the time played.
                if (state.isSolved && !wasSolved) {
                    updated = DeskActions.recordSolve(
                        updated,
                        state.puzzle.id,
                        state.timerSeconds.toInt(),
                        now(),
                    )
                }
                updated
            }
        }
    }
}
