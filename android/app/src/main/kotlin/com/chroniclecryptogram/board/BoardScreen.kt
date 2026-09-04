package com.chroniclecryptogram.board

import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.layout.safeDrawingPadding
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.casefile.WoodcutPlate
import com.chroniclecryptogram.designsystem.DeskWidth
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
                onRequestClear = { confirmingClear = true },
            )
        }
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
        containerColor = colors.paperCard,
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
    onRequestClear: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
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
                    .align(Alignment.CenterHorizontally),
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
            SolveBulletin(state = state, onNext = onNext)
        } else if (deskWidth.usesSideRail) {
            // Wide windows put the tools beside the keyboard rather than
            // stacking a full-width dock the player's thumbs cannot reach.
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom) {
                TypewriterKeyboard(
                    onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                    onBackspace = { onAction(BoardActions::backspace) },
                    modifier = Modifier.weight(1f),
                )
                DeskRail(
                    state = state,
                    onHint = { onAction(BoardActions::hint) },
                    onCheck = { onAction(BoardActions::check) },
                    onClear = onRequestClear,
                )
            }
        } else {
            DeskDock(
                state = state,
                onHint = { onAction(BoardActions::hint) },
                onCheck = { onAction(BoardActions::check) },
                onClear = onRequestClear,
            )
            TypewriterKeyboard(
                onLetter = { letter -> onAction { BoardActions.type(it, letter) } },
                onBackspace = { onAction(BoardActions::backspace) },
            )
        }
    }
}

@Composable
private fun Masthead(puzzle: PuzzleData) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier.padding(bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // The edition's press plate. Also the only reference to the woodcut
        // drawables, without which resource shrinking strips all thirty-one from
        // the release build -- the release APK is where that shows up, not debug.
        puzzle.silhouette?.let { WoodcutPlate(it) }
        Column(Modifier.weight(1f)) {
            Text(
                text = puzzle.headline,
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
            )
            Text(
                text = Edition.editionLabel(puzzle.editionNumber) + " · " +
                    Edition.chapterForEdition(puzzle.editionNumber).title,
                style = MaterialTheme.typography.labelLarge,
                color = colors.brass,
            )
        }
    }
}

/** Hints and checks, with their remaining counts. Both wallets are per-edition. */
@Composable
private fun DeskDock(
    state: BoardState,
    onHint: () -> Unit,
    onCheck: () -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        DockButton(
            label = "Hint (${state.hintsRemaining})",
            description = "Reveal the selected glyph. ${state.hintsRemaining} hints left this edition.",
            enabled = state.hintsRemaining > 0 && state.selectedSymbolId != null,
            onClick = onHint,
        )
        DockButton(
            label = "Check (${state.checksRemaining})",
            description = "Test the selected guess. ${state.checksRemaining} checks left this edition.",
            enabled = state.checksRemaining > 0 && state.selectedSymbolId != null,
            onClick = onCheck,
        )
        DockButton(
            label = "Clear",
            description = "Wipe every guess and start the quote over.",
            enabled = state.mappings.keys.any { it !in state.lockedSymbolIds },
            onClick = onClear,
        )
    }
}

@Composable
private fun DockButton(
    label: String,
    description: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    TextButton(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.semantics { contentDescription = description },
    ) {
        Text(label, color = ChronicleTheme.colors.ink)
    }
}

/** The same three tools, stacked vertically for a wide window. */
@Composable
private fun DeskRail(
    state: BoardState,
    onHint: () -> Unit,
    onCheck: () -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    Column(
        modifier
            .background(colors.paperMasthead)
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        DockButton(
            label = "Hint (${state.hintsRemaining})",
            description = "Reveal the selected glyph. ${state.hintsRemaining} hints left this edition.",
            enabled = state.hintsRemaining > 0 && state.selectedSymbolId != null,
            onClick = onHint,
        )
        DockButton(
            label = "Check (${state.checksRemaining})",
            description = "Test the selected guess. ${state.checksRemaining} checks left this edition.",
            enabled = state.checksRemaining > 0 && state.selectedSymbolId != null,
            onClick = onCheck,
        )
        DockButton(
            label = "Clear",
            description = "Wipe every guess and start the quote over.",
            enabled = state.mappings.keys.any { it !in state.lockedSymbolIds },
            onClick = onClear,
        )
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
