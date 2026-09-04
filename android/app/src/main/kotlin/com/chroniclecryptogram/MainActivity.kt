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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.activity.compose.LocalActivity
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
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
import com.chroniclecryptogram.cloud.createAccountRepository
import com.chroniclecryptogram.bureau.AccountState
import com.chroniclecryptogram.bureau.BureauScreen
import com.chroniclecryptogram.data.DataStoreDeskStore
import com.chroniclecryptogram.data.DataStorePrefsStore
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.KeyboardMode
import com.chroniclecryptogram.data.NoAccountRepository
import com.chroniclecryptogram.data.ThemeMode
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.EditionSlot
import com.chroniclecryptogram.data.Standings
import com.chroniclecryptogram.content.CaseFileContent
import com.chroniclecryptogram.content.CipherTacticsContent
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.guide.GuideScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
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
    val activity = LocalActivity.current
    val store = remember { DataStoreDeskStore.create(context.applicationContext) }
    val prefsStore = remember { DataStorePrefsStore.create(context.applicationContext) }
    val prefs by prefsStore.prefs.collectAsStateWithLifecycle(initialValue = DeskPrefs())
    val scope = rememberCoroutineScope()

    // Firebase is optional; without credentials the account section says so
    // rather than offering a button that cannot work.
    val accounts = remember {
        if (BuildConfig.HAS_FIREBASE) {
            createAccountRepository(BuildConfig.GOOGLE_WEB_CLIENT_ID)
        } else {
            NoAccountRepository
        }
    }
    val account by accounts.account.collectAsStateWithLifecycle(initialValue = null)
    var authBusy by remember { mutableStateOf(false) }
    var authError by remember { mutableStateOf<String?>(null) }

    // Roughly 100 KB of JSON across three files. Parsing it inside remember{}
    // ran on the main thread during composition and cost hundreds of frames on
    // first launch; produceState moves it to Dispatchers.IO and the UI waits on
    // the paper ground instead of blocking.
    val content by produceState<LoadedContent?>(initialValue = null) {
        value = withContext(Dispatchers.IO) {
            val repository = ContentRepository(context.assets)
            LoadedContent(
                puzzles = repository.puzzles(),
                caseFiles = repository.caseFiles(),
                tactics = repository.cipherTactics(),
            )
        }
    }

    val loaded = content
    if (loaded == null) {
        ChronicleTheme(dark = isSystemInDarkTheme()) {
            Box(Modifier.fillMaxSize().background(ChronicleTheme.colors.paper))
        }
        return
    }
    val puzzles = loaded.puzzles
    val caseFiles = loaded.caseFiles
    val tactics = loaded.tactics

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

    val dark = when (prefs.themeMode) {
        ThemeMode.System -> isSystemInDarkTheme()
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
    }

    ChronicleTheme(dark = dark, slot = slot) {
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
                        useSystemKeyboard = prefs.keyboardMode == KeyboardMode.System,
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

                    Destination.Desk -> BureauScreen(
                        solvedCount = solved.size,
                        totalEditions = Edition.maxEdition(puzzles),
                        prefs = prefs,
                        account = AccountState(
                            available = BuildConfig.HAS_FIREBASE,
                            signedIn = account?.anonymous == false,
                            displayName = account?.displayName,
                            busy = authBusy,
                            error = authError,
                        ),
                        onThemeMode = { scope.launch { prefsStore.setThemeMode(it) } },
                        onKeyboardMode = { scope.launch { prefsStore.setKeyboardMode(it) } },
                        onReduceMotion = { scope.launch { prefsStore.setReduceMotion(it) } },
                        onSignIn = {
                            scope.launch {
                                authBusy = true
                                authError = null
                                val host = activity
                                if (host == null) {
                                    authError = "No window to show the account chooser."
                                } else {
                                    accounts.signInWithGoogle(host)
                                        .onFailure { authError = it.message ?: "Sign-in failed." }
                                }
                                authBusy = false
                            }
                        },
                        onSignOut = { scope.launch { accounts.signOut() } },
                        board = {
                            LeaderboardScreen(
                                state = if (BuildConfig.HAS_FIREBASE) {
                                    LeaderboardBoardState.Ready(Standings.rank(emptyList(), null))
                                } else {
                                    LeaderboardBoardState.Offline
                                },
                                playerUid = account?.uid,
                            )
                        },
                    )
                }
            }
            DeskBar(current = navigator.current, onGo = navigator::go)
        }
    }
}

/**
 * The desk controls.
 *
 * Material3's NavigationBar rather than a hand-rolled Row: it gives the 48dp
 * targets, the selected indicator, and the selected/unselected semantics for
 * free, and it handles large font scales without the labels colliding.
 *
 * Icons are not decoration here. A text-only bar leans entirely on reading, and
 * at a large font scale five words do not fit a narrow phone.
 */
@Composable
private fun DeskBar(current: Destination, onGo: (Destination) -> Unit) {
    val colors = ChronicleTheme.colors
    NavigationBar(
        containerColor = colors.paperMasthead,
        contentColor = colors.ink,
    ) {
        for (destination in Destination.entries) {
            val (label, icon) = when (destination) {
                Destination.Board -> "Desk" to Icons.Filled.Create
                Destination.Archive -> "Archive" to Icons.AutoMirrored.Filled.List
                Destination.CaseFile -> "Case File" to Icons.Filled.Person
                Destination.Guide -> "Guide" to Icons.Filled.Info
                Destination.Desk -> "Bureau" to Icons.Filled.Settings
            }
            NavigationBarItem(
                selected = destination == current,
                onClick = { onGo(destination) },
                icon = { Icon(icon, contentDescription = null) },
                label = { Text(label, maxLines = 1) },
                alwaysShowLabel = true,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = colors.paper,
                    selectedTextColor = colors.brass,
                    indicatorColor = colors.brass,
                    unselectedIconColor = colors.ink,
                    unselectedTextColor = colors.ink,
                ),
            )
        }
    }
}

/** The three content files, parsed once off the main thread. */
private data class LoadedContent(
    val puzzles: List<PuzzleData>,
    val caseFiles: CaseFileContent,
    val tactics: CipherTacticsContent,
)
