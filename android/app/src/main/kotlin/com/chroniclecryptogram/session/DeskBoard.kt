package com.chroniclecryptogram.session

import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.chroniclecryptogram.BuildConfig
import com.chroniclecryptogram.board.BoardState
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.Leaderboard
import com.chroniclecryptogram.data.LeaderboardEntry
import com.chroniclecryptogram.data.PuzzleLiveStats
import com.chroniclecryptogram.data.PuzzleStatsRepository
import com.chroniclecryptogram.data.TitleBadges
import com.chroniclecryptogram.leaderboard.StandingsState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * What the app knows about the open puzzle's public standing.
 *
 * [board] and [note] feed the Bureau's board; [stats] feeds the bulletin's
 * figures. All three are absent in an offline build, where nothing is fetched
 * and nothing is filed.
 */
data class DeskBoard(
    val board: StandingsState,
    val note: String?,
    val stats: PuzzleLiveStats?,
)

/**
 * Fetches the standings, posts a finished time, and files the public counters.
 *
 * Lifted out of the app's root composable for the same reason [CloudSync] was:
 * six pieces of state and four effects that only concern the board were sitting
 * among the ones that concern the game, and the game's own wiring bugs have all
 * been of the kind that hides in a function that long.
 *
 * Every effect here is behind `HAS_FIREBASE`. In the 1.0 release that is false,
 * so this returns Offline and nothing else runs.
 */
@Composable
fun rememberDeskBoard(
    boards: Leaderboard,
    puzzleStats: PuzzleStatsRepository,
    state: BoardState?,
    uid: String?,
    prefs: DeskPrefs,
): DeskBoard {
    var board by remember {
        mutableStateOf<StandingsState>(
            if (BuildConfig.HAS_FIREBASE) StandingsState.Loading
            else StandingsState.Offline
        )
    }
    var note by remember { mutableStateOf<String?>(null) }
    var stats by remember { mutableStateOf<PuzzleLiveStats?>(null) }

    // Bumped after a successful write so the reader refetches and the player
    // sees where their own time landed.
    var boardRevision by remember { mutableIntStateOf(0) }
    var statsRevision by remember { mutableIntStateOf(0) }

    val puzzleId = state?.puzzle?.id
    val solved = state?.isSolved == true

    LaunchedEffect(puzzleId, uid, boardRevision) {
        if (!BuildConfig.HAS_FIREBASE || puzzleId == null) return@LaunchedEffect
        board = StandingsState.Loading
        board = runCatching { boards.standings(puzzleId, uid) }
            .fold(
                onSuccess = { StandingsState.Ready(it) },
                // Offline rather than an error screen: a board that cannot be
                // reached is the ordinary case on a train, not a fault.
                onFailure = { StandingsState.Offline },
            )
    }

    // Posting happens on the transition into solved, and only when the player
    // has chosen a name -- a time is published, so it is never posted under a
    // name they did not pick.
    LaunchedEffect(puzzleId, solved, prefs.canPost, uid) {
        val finished = state ?: return@LaunchedEffect
        val id = uid ?: return@LaunchedEffect
        if (!solved || !prefs.canPost) return@LaunchedEffect

        boards.post(
            finished.puzzle.id,
            LeaderboardEntry(
                uid = id,
                codename = prefs.codename,
                timeSeconds = finished.timerSeconds.toInt(),
                accuracy = finished.accuracy,
                hintsUsed = finished.hintsUsed,
                postedAt = System.currentTimeMillis(),
                titleBadge = prefs.titleBadge.ifBlank { TitleBadges.last() },
                timeFormatted = finished.timeFormatted,
                countryCode = prefs.countryCode,
            ),
        ).onSuccess {
            note = null
            boardRevision++
        }.onFailure { note = it.message }
    }

    // The public counters for whatever board is open. Opening a puzzle files a
    // start receipt, which is what the solve rate is measured against.
    LaunchedEffect(puzzleId, uid, statsRevision) {
        if (!BuildConfig.HAS_FIREBASE) return@LaunchedEffect
        val id = puzzleId ?: return@LaunchedEffect
        withContext(Dispatchers.IO) {
            if (uid != null) runCatching { puzzleStats.recordStart(uid, id) }
            stats = runCatching { puzzleStats.stats(id) }.getOrNull()
        }
    }

    // Filed once per player per puzzle; the rules refuse a second receipt, so a
    // replayed puzzle cannot pad the public counters.
    LaunchedEffect(puzzleId, solved, uid) {
        val finished = state ?: return@LaunchedEffect
        val id = uid ?: return@LaunchedEffect
        if (!solved) return@LaunchedEffect
        withContext(Dispatchers.IO) {
            puzzleStats.recordSolve(
                uid = id,
                puzzleId = finished.puzzle.id,
                timeSeconds = finished.timerSeconds.toInt(),
                hintsUsed = finished.hintsUsed,
                accuracy = finished.accuracy,
                solverName = prefs.codename,
            ).onFailure { Log.w(SyncTag, "solve receipt refused -- ${it.message}") }
        }
        statsRevision++
    }

    return DeskBoard(board = board, note = note, stats = stats)
}
