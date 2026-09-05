package com.chroniclecryptogram

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.produceState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import com.chroniclecryptogram.content.ContentParser
import com.chroniclecryptogram.cloud.createAccountRepository
import com.chroniclecryptogram.cloud.createCloudDesk
import com.chroniclecryptogram.cloud.createLeaderboard
import com.chroniclecryptogram.cloud.createPuzzleStats
import com.chroniclecryptogram.cloud.setCrashReporting
import com.chroniclecryptogram.bureau.AccountState
import com.chroniclecryptogram.bureau.BureauScreen
import com.chroniclecryptogram.data.DataStoreDeskStore
import com.chroniclecryptogram.data.DeskPrefsStore
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.KeyboardMode
import com.chroniclecryptogram.data.NoAccountRepository
import com.chroniclecryptogram.data.ThemeMode
import com.chroniclecryptogram.designsystem.CompactChrome
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.EditionSlot
import com.chroniclecryptogram.content.CaseFileContent
import com.chroniclecryptogram.content.CipherTacticsContent
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.guide.GuideScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.chroniclecryptogram.leaderboard.LeaderboardScreen
import com.chroniclecryptogram.session.rememberDeskBoard
import com.chroniclecryptogram.session.CloudSync
import com.chroniclecryptogram.splash.SplashScreen

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Before super.onCreate, and before anything else: this is what hands
        // the window from the launch theme over to Theme.Chronicle. Without it
        // the activity keeps the splash theme for its whole life, which brings
        // that theme's action bar with it.
        installSplashScreen()
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
    val prefsStore = remember { DeskPrefsStore.create(context.applicationContext) }
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
    val boards = remember { createLeaderboard(BuildConfig.HAS_FIREBASE) }
    val cloud = remember { createCloudDesk(BuildConfig.HAS_FIREBASE) }
    val puzzleStats = remember { createPuzzleStats(BuildConfig.HAS_FIREBASE) }

    // Crash reporting follows whether this build has credentials at all: a
    // Firebase-less build has nowhere to report to. No uid is attached -- tying
    // a crash to a player's account is not needed to fix a crash.
    LaunchedEffect(Unit) { setCrashReporting(BuildConfig.HAS_FIREBASE) }
    val account by accounts.account.collectAsStateWithLifecycle(initialValue = null)
    var authBusy by remember { mutableStateOf(false) }
    var authError by remember { mutableStateOf<String?>(null) }

    // Sign in anonymously so progress has a home in the cloud before the player
    // ever names themselves -- the same thing the web build does on load. It
    // needs no OAuth client, so it works even when Google sign-in does not, and
    // signInWithGoogle later *links* this uid rather than replacing it, which is
    // what carries the anonymous progress into the named account.
    LaunchedEffect(accounts) {
        if (BuildConfig.HAS_FIREBASE) accounts.signInAnonymously()
    }

    // Roughly 100 KB of JSON across three files. Parsing it inside remember{}
    // ran on the main thread during composition and cost hundreds of frames on
    // first launch; produceState moves it to Dispatchers.IO and the UI waits on
    // the paper ground instead of blocking.
    val content by produceState<LoadedContent?>(initialValue = null) {
        value = withContext(Dispatchers.IO) {
            val repository = ContentParser.fromAssets(context.assets)
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

    val uid = account?.uid
    CloudSync(
        store = store,
        cloud = cloud,
        uid = uid,
        displayName = account?.displayName,
        prefs = prefs,
    )

    val standings = rememberDeskBoard(
        boards = boards,
        puzzleStats = puzzleStats,
        state = board,
        uid = uid,
        prefs = prefs,
    )

    // Shown once per launch, as the web shows it once per session. It is state
    // rather than a preference on purpose: a splash a player can never see again
    // is a splash that was not worth building.
    var entered by remember { mutableStateOf(false) }

    ChronicleTheme(dark = dark, slot = slot, reduceMotion = prefs.reduceMotion) {
        if (!entered) {
            SplashScreen(
                onEnter = { entered = true },
                reduceMotion = prefs.reduceMotion,
            )
            return@ChronicleTheme
        }

        val current = board
        val solved = desk?.solvedPuzzleIds?.toSet().orEmpty()

        if (current == null) {
            // The desk is read from disk before the first frame; a blank paper
            // ground beats a flash of an empty board.
            Box(Modifier.fillMaxSize().background(ChronicleTheme.colors.paper))
            return@ChronicleTheme
        }

        Column(Modifier.fillMaxSize().background(ChronicleTheme.colors.paper)) {
            // Centred, because the list screens now set themselves to a
            // reading measure rather than filling a landscape phone's width.
            // The desk fills the space anyway, so this is a no-op for it.
            Box(Modifier.weight(1f), contentAlignment = Alignment.TopCenter) {
                when (navigator.current) {
                    Destination.Board -> {
                        // The clock runs only while the desk is on screen, and
                        // stops with the composition when the app is backgrounded.
                        LaunchedEffect(current.puzzle.id) { model.runClock() }
                        BoardScreen(
                            state = current,
                            onAction = model::act,
                            onNext = model::advance,
                            useSystemKeyboard = prefs.keyboardMode == KeyboardMode.System,
                            tactics = tactics.tactics,
                            liveStats = standings.stats,
                        )
                    }

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
                        onPrefs = { edit -> scope.launch { prefsStore.update(edit) } },
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
                        onDeleteAccount = {
                            scope.launch {
                                authBusy = true
                                authError = null
                                val id = account?.uid
                                withContext(Dispatchers.IO) {
                                    // Documents first, then the auth user. The
                                    // other order strands the data under a uid
                                    // nobody can authenticate as, so it could
                                    // never be deleted afterwards.
                                    if (id != null) runCatching { cloud.deleteAccountData(id) }
                                }
                                accounts.deleteAccount()
                                    .onFailure {
                                        authError = it.message ?: "The account could not be deleted."
                                    }
                                authBusy = false
                            }
                        },
                        board = {
                            LeaderboardScreen(
                                state = standings.board,
                                playerUid = account?.uid,
                                note = standings.note,
                            )
                        },
                    )
                }
            }
            // The section rail steps aside for the keyboard. It would be
            // behind the IME and unreachable anyway -- and leaving it in the
            // layout makes the board's imePadding over-inset by exactly the
            // rail's height, which is the slab of dead paper that showed up
            // above the keyboard.
            val imeVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
            if (!imeVisible) {
                DeskBar(current = navigator.current, onGo = navigator::go)
            }
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
internal fun DeskBar(current: Destination, onGo: (Destination) -> Unit) {
    val colors = ChronicleTheme.colors

    Row(
        Modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            // The masthead rule. A newspaper separates its sections with a rule,
            // not with a shadow, so the bar is joined to the page above it
            // rather than floating over it.
            .drawBehind {
                drawRect(
                    color = inkRule,
                    size = Size(size.width, ruleHeight.toPx()),
                )
            }
            .navigationBarsPadding()
            .padding(top = 4.dp),
        verticalAlignment = Alignment.Top,
    ) {
        // Five fixed columns: the labels have to stop growing before they run
        // off the ends. The icons carry the same meaning at any scale.
        CompactChrome {
        for (destination in Destination.entries) {
            val (label, icon) = when (destination) {
                Destination.Board -> "Desk" to R.drawable.ic_nav_desk
                Destination.Archive -> "Archive" to R.drawable.ic_nav_archive
                Destination.CaseFile -> "Case File" to R.drawable.ic_nav_casefile
                Destination.Guide -> "Guide" to R.drawable.ic_nav_guide
                Destination.Desk -> "Bureau" to R.drawable.ic_nav_bureau
            }
            DeskBarItem(
                label = label,
                icon = icon,
                selected = destination == current,
                onClick = { onGo(destination) },
                modifier = Modifier.weight(1f),
            )
        }
        }
    }
}

/** The rule under the masthead, and the section marker on the open one. */
private val ruleHeight = 2.dp
private val inkRule = Color(0xFF1C1A17)

/**
 * One section of the desk.
 *
 * A newspaper section marker rather than Material's pill: the open section takes
 * a cinnabar rule and heavier type. Both change together, so the state is never
 * carried by colour alone -- and the whole column is the target, which is what
 * gets it past 48dp without a stock component doing it.
 */
@Composable
internal fun DeskBarItem(
    label: String,
    icon: Int,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val tint = if (selected) colors.ink else colors.paperRule

    Column(
        modifier
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.Tab,
                // No ripple: a Material ripple on paper is the one thing that
                // gives away that this is not print.
                indication = null,
                interactionSource = remember { MutableInteractionSource() },
            )
            .heightIn(min = 56.dp)
            .padding(vertical = 6.dp)
            .semantics { contentDescription = label },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        // The section rule, above the mark, the width of the column's type.
        Box(
            Modifier
                .width(28.dp)
                .height(3.dp)
                .background(if (selected) colors.cinnabar else Color.Transparent)
        )
        Icon(
            painter = painterResource(icon),
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(22.dp),
        )
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelLarge,
            fontSize = 10.sp,
            letterSpacing = 0.6.sp,
            fontWeight = if (selected) FontWeight.Black else FontWeight.Normal,
            color = tint,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
        )
    }
}

/** The three content files, parsed once off the main thread. */
private data class LoadedContent(
    val puzzles: List<PuzzleData>,
    val caseFiles: CaseFileContent,
    val tactics: CipherTacticsContent,
)
