package com.chroniclecryptogram.board

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
                colors = colors,
                puzzle = puzzle,
                onNext = onNext,
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
    val colors = ChronicleTheme.colors
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.paperCard,
        titleContentColor = colors.ink,
        textContentColor = colors.ink,
        // A filed dispatch, not a Material card. The stock 28dp corner radius is
        // the single most recognisable Material tell, and this app is printed.
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.border(2.dp, colors.ink, RoundedCornerShape(4.dp)),
        title = { Text("Clear letters", color = colors.ink) },
        text = {
            Text(
                "This wipes every mapped letter on this edition. The cipher itself stays.",
                color = colors.ink,
            )
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                modifier = Modifier.semantics { contentDescription = "Confirm clearing every letter" },
            ) {
                Text("Clear letters", color = colors.cinnabar)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.semantics { contentDescription = "Keep working" },
            ) {
                Text("Keep working", color = colors.ink)
            }
        },
    )
}

@Composable
private fun DeskContent(
    state: BoardState,
    onAction: ((BoardState) -> BoardState) -> Unit,
    deskWidth: DeskWidth,
    colors: com.chroniclecryptogram.designsystem.theme.ChronicleColors,
    puzzle: PuzzleData,
    onNext: (() -> Unit)?,
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
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 12.dp),
        ) {
            Masthead(puzzle)

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
                    // A reading measure, so a wide window does not stretch the
                    // board across the whole screen.
                    .then(
                        if (deskWidth.boardMaxWidth != Dp.Unspecified) {
                            Modifier.widthIn(max = deskWidth.boardMaxWidth)
                        } else {
                            Modifier
                        }
                    )
                    .align(Alignment.CenterHorizontally)
                    // The folio: a bordered sheet of scanned paper the cipher
                    // is printed on, rather than glyphs floating on the desk.
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
                    onCellClick = { cellId, _ -> onAction { BoardActions.select(it, cellId) } },
                )
            }
        }

        if (state.isSolved) {
            SolveBulletin(state = state, onNext = onNext, liveStats = liveStats)
        } else if (deskWidth.usesSideRail) {
            // Wide windows put the tools beside the keyboard rather than
            // stacking a full-width dock the player's thumbs cannot reach.
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
                TypewriterKeyboard(
                    onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                    onBackspace = { onAction(BoardActions::backspace) },
                    modifier = Modifier.weight(1f),
                )
                DeskRail(tools)
            }
        } else {
            DeskDock(tools)
            if (useSystemKeyboard) {
                SystemKeyboardField(
                    enabled = state.selectedCellId != null,
                    onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                    onBackspace = { onAction(BoardActions::backspace) },
                )
            } else {
                TypewriterKeyboard(
                    onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                    onBackspace = { onAction(BoardActions::backspace) },
                )
            }
        }
    }
}

@Composable
private fun Masthead(puzzle: PuzzleData) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier.padding(bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // The edition's press plate. Also the only reference to the woodcut
        // drawables, without which resource shrinking strips all thirty-one from
        // the release build -- the release APK is where that shows up, not debug.
        puzzle.silhouette?.let { WoodcutPlate(it) }
        Column(Modifier.weight(1f)) {
            Text(
                // Two lines at most: on the board the headline is a kicker over
                // the cipher, and a three-line masthead pushes the quote itself
                // off a phone screen.
                text = puzzle.headline,
                style = MaterialTheme.typography.displayMedium.copy(
                    fontSize = 24.sp,
                    lineHeight = 27.sp,
                ),
                color = colors.ink,
                maxLines = 2,
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

/** A-Z from a hardware keyboard. */
private val LetterKeys: Map<Key, String> = buildMap {
    val keys = listOf(
        Key.A, Key.B, Key.C, Key.D, Key.E, Key.F, Key.G, Key.H, Key.I,
        Key.J, Key.K, Key.L, Key.M, Key.N, Key.O, Key.P, Key.Q, Key.R,
        Key.S, Key.T, Key.U, Key.V, Key.W, Key.X, Key.Y, Key.Z,
    )
    keys.forEachIndexed { index, key -> put(key, ('A' + index).toString()) }
}
