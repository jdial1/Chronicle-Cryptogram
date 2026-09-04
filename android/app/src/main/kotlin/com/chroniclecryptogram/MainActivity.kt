package com.chroniclecryptogram

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.chroniclecryptogram.archive.ArchiveScreen
import com.chroniclecryptogram.board.BoardScreen
import com.chroniclecryptogram.board.BoardViewModel
import com.chroniclecryptogram.casefile.CaseFileScreen
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.content.ContentRepository
import com.chroniclecryptogram.data.DataStoreDeskStore
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.EditionSlot
import com.chroniclecryptogram.data.Standings
import com.chroniclecryptogram.guide.GuideScreen
import com.chroniclecryptogram.leaderboard.LeaderboardScreen
import com.chroniclecryptogram.leaderboard.BoardState as LeaderboardBoardState

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Draws behind the system bars. Replaces the edge-to-edge config plugin
        // the Expo shell needed and the --safe-* variables it injected into the
        // WebView; Modifier.safeDrawingPadding does the rest.
        enableEdgeToEdge()
        setContent { ChronicleApp() }
    }
}

@Composable
private fun ChronicleApp() {
    val context = LocalContext.current
    val repository = remember { ContentRepository(context.assets) }
    val puzzles = remember { repository.puzzles() }
    val caseFiles = remember { repository.caseFiles() }
    val tactics = remember { repository.cipherTactics() }
    val store = remember { DataStoreDeskStore.create(context.applicationContext) }

    val model: BoardViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                BoardViewModel(store, puzzles) as T
        }
    )

    LaunchedEffect(Unit) { model.open() }
    val board by model.state.collectAsStateWithLifecycle()
    val desk by store.state.collectAsStateWithLifecycle(initialValue = null)
    val navigator = rememberNavigator()

    val slot = when {
        board == null -> EditionSlot.Morning
        Edition.isNightEdition(board!!.puzzle) -> EditionSlot.Evening
        else -> EditionSlot.Morning
    }

    ChronicleTheme(dark = isSystemInDarkTheme(), slot = slot) {
        val current = board
        val solved = desk?.solvedPuzzleIds?.toSet().orEmpty()

        if (current == null) {
            // The desk is read from disk before the first frame; a blank paper
            // ground beats a flash of an empty board.
            Box(Modifier.fillMaxSize().background(ChronicleTheme.colors.paper))
            return@ChronicleTheme
        }

        Column(Modifier.fillMaxSize().background(ChronicleTheme.colors.paper)) {
            Box(Modifier.weight(1f)) {
                when (navigator.current) {
                    Destination.Board -> BoardScreen(
                        state = current,
                        onAction = model::act,
                        onNext = model::advance,
                    )

                    Destination.Archive -> ArchiveScreen(
                        puzzles = puzzles,
                        solvedPuzzleIds = solved,
                        onOpen = { puzzle ->
                            model.open(puzzle)
                            navigator.home()
                        },
                    )

                    Destination.CaseFile -> CaseFileScreen(
                        content = caseFiles,
                        puzzles = puzzles,
                        solvedPuzzleIds = solved,
                    )

                    Destination.Guide -> GuideScreen(tactics = tactics)

                    Destination.Leaderboard -> LeaderboardScreen(
                        // Firestore is not wired to the UI yet; a build without
                        // credentials shows the offline notice rather than an
                        // empty board that looks like nobody has played.
                        state = if (BuildConfig.HAS_FIREBASE) {
                            LeaderboardBoardState.Ready(Standings.rank(emptyList(), null))
                        } else {
                            LeaderboardBoardState.Offline
                        },
                        playerUid = null,
                    )

                    Destination.Desk -> DeskScreen(
                        solvedCount = solved.size,
                        totalEditions = Edition.maxEdition(puzzles),
                    )
                }
            }
            DeskBar(current = navigator.current, onGo = navigator::go)
        }
    }
}

/** The masthead controls, as a bottom bar so they stay in thumb reach. */
@Composable
private fun DeskBar(current: Destination, onGo: (Destination) -> Unit) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            .safeDrawingPadding()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        for (destination in Destination.entries) {
            val label = when (destination) {
                Destination.Board -> "Desk"
                Destination.Archive -> "Archive"
                Destination.CaseFile -> "Case File"
                Destination.Leaderboard -> "Board"
                Destination.Guide -> "Guide"
                Destination.Desk -> "Bureau"
            }
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = if (destination == current) colors.brass else colors.ink,
                modifier = Modifier
                    .clickable { onGo(destination) }
                    .padding(horizontal = 8.dp, vertical = 4.dp)
                    .semantics {
                        contentDescription =
                            if (destination == current) "$label, current" else label
                    },
            )
        }
    }
}

/** The Bureau File: campaign progress, and the settings that will live here. */
@Composable
private fun DeskScreen(solvedCount: Int, totalEditions: Int, modifier: Modifier = Modifier) {
    val colors = ChronicleTheme.colors
    Column(
        modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "Bureau File",
            style = MaterialTheme.typography.displayMedium,
            color = colors.ink,
        )
        Text(
            // The campaign stat that replaced the streak, which only ever
            // incremented and was tautological under progression gating.
            text = "Editions decoded — $solvedCount / $totalEditions",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.ink,
            modifier = Modifier.semantics {
                contentDescription = "Editions decoded, $solvedCount of $totalEditions"
            },
        )
    }
}
