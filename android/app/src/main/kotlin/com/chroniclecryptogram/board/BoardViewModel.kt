package com.chroniclecryptogram.board

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chroniclecryptogram.cipher.Merge
import com.chroniclecryptogram.cipher.PrimerPractice
import com.chroniclecryptogram.cipher.model.Wallets
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.data.DeskActions
import com.chroniclecryptogram.data.DeskState
import com.chroniclecryptogram.data.DeskStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import com.chroniclecryptogram.cipher.DeskTimer
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
            if (saved == null && !Edition.isPracticePuzzle(target)) {
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

    /**
     * Runs the solve clock until cancelled.
     *
     * Nothing incremented `timerSeconds` before this: [DeskTimer] existed, was
     * fixture-tested against the web's `useDeskTimer`, and had no caller. Every
     * solve reported 00:00.0 -- and since both the leaderboard and the public
     * solve counters refuse a time under five seconds, an Android player could
     * never post one or be counted.
     *
     * Deliberately a suspending function the desk collects rather than a job the
     * ViewModel starts for itself. The caller's scope decides when time accrues,
     * so it stops when the desk leaves the screen and when the app goes to the
     * background -- reading the archive is not solving -- and a test drives it
     * with a virtual clock instead of hanging on an endless loop.
     */
    suspend fun runClock() {
        while (currentCoroutineContext().isActive) {
            delay(DeskTimer.TICK_MS)
            val current = _state.value ?: continue
            // A finished puzzle left open must not keep accruing time.
            if (current.isSolved) continue
            _state.value = current.copy(
                timerSeconds = DeskTimer.advanceDeskClock(current.timerSeconds),
            )
        }
    }

    /**
     * Mints a fresh drill and opens it.
     *
     * [pool] is `primerPractice.json`, staged from `src/data` like the rest of
     * the content. Nothing happens when the season carries no Primer to cut a
     * drill from, which is the same thing the web does.
     */
    fun startPractice(pool: List<String>) {
        val current = _state.value?.puzzle
        val exclude = current?.takeIf { Edition.isPracticePuzzle(it) }?.originalText
        PrimerPractice.create(puzzles, pool, excludeText = exclude)?.let { open(it) }
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
        // A drill counts for nothing. It is not saved, because its id is unique
        // per drill and the desk would accumulate a dead board for every one
        // ever started; and it is not recorded, because a drill in the campaign
        // count would let a player run the season total past the season.
        //
        // The wallets are the exception, and deliberately: a drill carries the
        // Primer's edition number, so its hints and checks come out of the
        // Primer's three. Otherwise drills would be an unlimited hint supply.
        val practice = Edition.isPracticePuzzle(state.puzzle)

        viewModelScope.launch {
            store.update { desk ->
                var updated = if (practice) desk else DeskActions.saveProgress(
                    desk,
                    state.puzzle.id,
                    BoardActions.toProgress(state),
                    now(),
                )
                updated = DeskActions.saveHintWallet(
                    updated,
                    Merge.clipDailyWallet(
                        state.puzzle.editionNumber,
                        state.hintsUsed.toDouble(),
                    ),
                    now(),
                )
                updated = DeskActions.saveCheckWallet(
                    updated,
                    Merge.clipDailyWallet(
                        state.puzzle.editionNumber,
                        state.checksUsed.toDouble(),
                        Wallets.DAILY_CHECKS,
                    ),
                    now(),
                )
                // Only on the transition into solved, so reopening a finished
                // puzzle cannot pad the campaign count or the time played.
                if (state.isSolved && !wasSolved && !practice) {
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
