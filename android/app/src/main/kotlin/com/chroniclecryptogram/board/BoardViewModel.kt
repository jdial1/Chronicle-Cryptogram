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
import kotlinx.coroutines.flow.first
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
            val fresh = BoardState.forPuzzle(target)
            val saved = DeskActions.progressFor(desk, target.id)

            var restored = if (saved != null) BoardActions.restore(fresh, saved) else fresh

            // Wallets are per-edition and shared by the morning and night extra,
            // so they are reconciled against every board in the edition rather
            // than read from this puzzle alone.
            val editionPuzzles = puzzles.map { it.id to it.editionNumber }
            restored = restored.copy(
                hintsRemaining = DeskActions
                    .reconcileHints(desk, target.editionNumber, editionPuzzles).remaining,
                checksRemaining = DeskActions
                    .reconcileChecks(desk, target.editionNumber, editionPuzzles).remaining,
            )

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
