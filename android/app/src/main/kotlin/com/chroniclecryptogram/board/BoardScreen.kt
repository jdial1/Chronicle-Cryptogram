package com.chroniclecryptogram.board

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.content.CipherTactic
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.casefile.WoodcutPlate
import com.chroniclecryptogram.data.PuzzleLiveStats
import com.chroniclecryptogram.designsystem.DeskWidth
import com.chroniclecryptogram.designsystem.scannedPaper
import com.chroniclecryptogram.designsystem.LocalDeskWidth
import com.chroniclecryptogram.designsystem.ChronicleDialog
import com.chroniclecryptogram.designsystem.DialogAction
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * The desk: masthead, board, tool dock and typewriter.
 *
 * The board scrolls; the dock and keyboard sit below it and track the IME
 * through [imePadding]. The web build reserves space for that dock with four
 * hard-coded rem values selected by a CSS `:has()` rule, because it has no way
 * to ask how tall the keyboard actually is.
 */
@Composable
fun BoardScreen(
    state: BoardState,
    onAction: ((BoardState) -> BoardState) -> Unit,
    modifier: Modifier = Modifier,
    onNext: (() -> Unit)? = null,
    /** Mints another Primer drill; null where the season has no Primer. */
    onPractice: (() -> Unit)? = null,
    useSystemKeyboard: Boolean = false,
    tactics: List<CipherTactic> = emptyList(),
    liveStats: PuzzleLiveStats? = null,
) {
    val colors = ChronicleTheme.colors
    val puzzle = state.puzzle

    // Deselecting is a real back action -- it must not close the app.
    BackHandler(enabled = state.selectedCellId != null) {
        onAction { it.copy(selectedCellId = null) }
    }

    // Clearing wipes every guess on the edition, so it asks first. The web has
    // the same confirmation; without it a stray tap on a nearly-solved board is
    // unrecoverable.
    var confirmingClear by remember { mutableStateOf(false) }
    var showingTally by remember { mutableStateOf(false) }

    val tools = deskTools(
        state = state,
        onHint = { onAction(BoardActions::hint) },
        onCheck = { onAction(BoardActions::check) },
        onUndo = { onAction(BoardActions::undo) },
        onTally = { showingTally = true },
        onClear = { confirmingClear = true },
    )

    BoxWithConstraints(modifier.fillMaxSize()) {
        val deskWidth = DeskWidth.fromWidth(maxWidth)
        CompositionLocalProvider(LocalDeskWidth provides deskWidth) {
            DeskContent(
                state = state,
                onAction = onAction,
                deskWidth = deskWidth,
                deskHeight = maxHeight,
                colors = colors,
                puzzle = puzzle,
                onNext = onNext,
                onPractice = onPractice,
                tools = tools,
                tactics = tactics,
                liveStats = liveStats,
                useSystemKeyboard = useSystemKeyboard,
            )
        }
    }

    if (showingTally) {
        TallySheet(
            state = state,
            onSelectSymbol = { symbolId ->
                state.firstCellFor(symbolId)?.let { cellId ->
                    onAction { BoardActions.select(it, cellId) }
                }
            },
            onDismiss = { showingTally = false },
        )
    }

    if (confirmingClear) {
        ClearLettersDialog(
            onDismiss = { confirmingClear = false },
            onConfirm = {
                confirmingClear = false
                onAction(BoardActions::clearLetters)
            },
        )
    }
}

@Composable
private fun ClearLettersDialog(onDismiss: () -> Unit, onConfirm: () -> Unit) {
    ChronicleDialog(
        title = "Clear letters",
        onDismissRequest = onDismiss,
        confirm = DialogAction(
            label = "Clear letters",
            onClick = onConfirm,
            destructive = true,
            description = "Confirm clearing every letter",
        ),
        dismiss = DialogAction(
            label = "Keep working",
            onClick = onDismiss,
            description = "Keep working",
        ),
    ) {
        Text(
            "This wipes every mapped letter on this edition. The cipher itself stays.",
            color = ChronicleTheme.colors.ink,
        )
    }
}

@Composable
private fun DeskContent(
    state: BoardState,
    onAction: ((BoardState) -> BoardState) -> Unit,
    deskWidth: DeskWidth,
    /** The room the desk actually has, which the keyboard is budgeted against. */
    deskHeight: Dp,
    colors: com.chroniclecryptogram.designsystem.theme.ChronicleColors,
    puzzle: PuzzleData,
    onNext: (() -> Unit)?,
    onPractice: (() -> Unit)?,
    useSystemKeyboard: Boolean,
    tools: List<DeskTool>,
    tactics: List<CipherTactic>,
    liveStats: PuzzleLiveStats?,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.paper)
            // Top and side insets only. The desk bar below owns the bottom one,
            // so taking it here too leaves a dead band under the keyboard.
            .statusBarsPadding()
            .displayCutoutPadding()
            .imePadding()
            // Physical keyboards on tablets, Chromebooks and DeX. The web build
            // got this by accident through its hidden input; here it is explicit.
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                when {
                    event.key == Key.Backspace || event.key == Key.Delete -> {
                        onAction(BoardActions::backspace); true
                    }
                    else -> {
                        val letter = LetterKeys[event.key]
                        if (letter != null) {
                            onAction { BoardActions.type(it, letter) }; true
                        } else {
                            false
                        }
                    }
                }
            },
    ) {
        // A phone turned on its side has plenty of width and almost no height:
        // masthead, board, dock and keyboard cannot all be stacked in ~310dp.
        // Side by side they all fit, and the board keeps the full height.
        val sideBySide = deskWidth != DeskWidth.Compact && deskHeight < SideRailMinHeight

        // A short desk cannot afford the full masthead as well.
        val compactMasthead = deskHeight < SideRailMinHeight

        // The side rail is chosen on width alone, and a phone in landscape is
        // wide but short. Five stacked tools at the 48dp minimum come to about
        // 260dp, which on a 310dp-tall desk left the cipher nothing at all --
        // the rail, not the keyboard, was the tall one.
        val useSideRail = deskWidth.usesSideRail && deskHeight >= SideRailMinHeight

        // Stacked, the bank is budgeted from what the board needs rather than
        // from what the keyboard would like. Side by side it has the whole
        // height and only its own width to answer to.
        val keyboardBudget = if (sideBySide) {
            deskHeight - DockAllowance
        } else {
            (deskHeight - BoardMinHeight - DockAllowance)
                .coerceIn(MinKeyboardHeight, deskHeight * 0.42f)
        }

        val board: @Composable ColumnScope.() -> Unit = {
            Column(
                Modifier
                    .weight(1f)
                    // A new edition starts at the top of its own board rather
                    // than wherever the last one was left scrolled.
                    .verticalScroll(remember(state.puzzle.id) { ScrollState(0) })
                    .padding(horizontal = 16.dp, vertical = 12.dp),
            ) {
                Masthead(puzzle, compact = compactMasthead)

                // Only the Primer coaches. Its hints name the words in that one
                // quote, and a permanent tutorial strip would be noise on every
                // other edition.
                if (Edition.isPrimerPuzzle(puzzle) && !state.isSolved) {
                    PrimerCoach(
                        tactics = tactics,
                        words = state.words,
                        mappings = state.mappings,
                        isSolved = state.isSolved,
                    )
                }

                Box(
                    Modifier
                        .fillMaxWidth()
                        // A reading measure, so a wide window does not stretch
                        // the board across the whole screen.
                        .then(
                            if (deskWidth.boardMaxWidth != Dp.Unspecified) {
                                Modifier.widthIn(max = deskWidth.boardMaxWidth)
                            } else {
                                Modifier
                            }
                        )
                        .align(Alignment.CenterHorizontally)
                        // The folio: a bordered sheet of scanned paper the
                        // cipher is printed on, rather than glyphs floating on
                        // the desk.
                        .border(1.dp, colors.paperRule)
                        .scannedPaper(fill = colors.paperGrainFill, dot = colors.paperGrain)
                        .padding(horizontal = 12.dp, vertical = 16.dp),
                ) {
                    CipherBoard(
                        words = state.words,
                        mappings = state.mappings,
                        selectedCellId = state.selectedCellId,
                        lockedSymbolIds = state.lockedSymbolIds,
                        flaggedSymbolIds = state.flaggedSymbolIds,
                        onCellClick = { cellId, _ ->
                            onAction { BoardActions.select(it, cellId) }
                        },
                    )
                }
            }
        }

        val instrument: @Composable ColumnScope.() -> Unit = {
            if (state.isSolved) {
                SolveBulletin(
                    state = state,
                    onNext = onNext,
                    liveStats = liveStats,
                    // Offered off the Primer and off a drill; a real edition's
                    // bulletin has its own way on.
                    onPractice = onPractice.takeIf {
                        Edition.isPrimerPuzzle(state.puzzle) ||
                            Edition.isPracticePuzzle(state.puzzle)
                    },
                )
            } else if (useSideRail) {
                // Room enough to put the tools beside the keyboard rather than
                // stacking a full-width dock the player's thumbs cannot reach.
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
                    TypewriterKeyboard(
                        onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                        onBackspace = { onAction(BoardActions::backspace) },
                        modifier = Modifier.weight(1f),
                        maxHeight = keyboardBudget,
                    )
                    DeskRail(tools)
                }
            } else {
                DeskDock(tools)
                if (useSystemKeyboard) {
                    SystemKeyboardField(
                        selectedCellId = state.selectedCellId,
                        onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                        onBackspace = { onAction(BoardActions::backspace) },
                    )
                } else {
                    TypewriterKeyboard(
                        onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                        onBackspace = { onAction(BoardActions::backspace) },
                        maxHeight = keyboardBudget,
                    )
                }
            }
        }

        if (sideBySide) {
            Row(Modifier.fillMaxSize()) {
                Column(Modifier.weight(0.46f).fillMaxHeight(), content = board)
                Column(
                    Modifier.weight(0.54f).fillMaxHeight(),
                    verticalArrangement = Arrangement.Bottom,
                    content = instrument,
                )
            }
        } else {
            board()
            instrument()
        }
    }
}

@Composable
private fun Masthead(puzzle: PuzzleData, compact: Boolean = false) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier.padding(bottom = if (compact) 4.dp else 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // The edition's press plate. Also the only reference to the woodcut
        // drawables, without which resource shrinking strips all thirty-one from
        // the release build -- the release APK is where that shows up, not debug.
        // The press plate is the first thing to go when there is no room: it is
        // decoration, and the cipher is not.
        if (!compact) puzzle.silhouette?.let { WoodcutPlate(it) }
        Column(Modifier.weight(1f)) {
            Text(
                // Two lines at most: on the board the headline is a kicker over
                // the cipher, and a three-line masthead pushes the quote itself
                // off a phone screen.
                text = puzzle.headline,
                style = MaterialTheme.typography.displayMedium.copy(
                    fontSize = if (compact) 18.sp else 24.sp,
                    lineHeight = if (compact) 21.sp else 27.sp,
                ),
                color = colors.ink,
                maxLines = if (compact) 1 else 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                // Edition 0's label and its chapter title are both "The Primer";
                // printing both reads as a bug rather than as a kicker.
                text = Edition.editionLabel(puzzle.editionNumber).let { label ->
                    val chapter = Edition.chapterForEdition(puzzle.editionNumber).title
                    if (chapter == label) label else "$label · $chapter"
                },
                style = MaterialTheme.typography.labelLarge,
                color = colors.brass,
            )
        }
    }
}

/**
 * The vertical room the side rail needs before it is worth using.
 *
 * Five tools at the 48dp accessible minimum, plus their spacing and the bed's
 * padding, is roughly 260dp; anything under this and the board is squeezed out.
 */
private val SideRailMinHeight = 480.dp

/** What the board keeps for itself before the keyboard is given anything. */
private val BoardMinHeight = 190.dp

/** Roughly what the flat dock costs, so the budget can allow for it. */
private val DockAllowance = 64.dp

/** Below this the keys stop being worth pressing, so the board yields instead. */
private val MinKeyboardHeight = 104.dp

/** A-Z from a hardware keyboard. */
private val LetterKeys: Map<Key, String> = buildMap {
    val keys = listOf(
        Key.A, Key.B, Key.C, Key.D, Key.E, Key.F, Key.G, Key.H, Key.I,
        Key.J, Key.K, Key.L, Key.M, Key.N, Key.O, Key.P, Key.Q, Key.R,
        Key.S, Key.T, Key.U, Key.V, Key.W, Key.X, Key.Y, Key.Z,
    )
    keys.forEachIndexed { index, key -> put(key, ('A' + index).toString()) }
}
