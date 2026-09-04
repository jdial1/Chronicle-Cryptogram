package com.chroniclecryptogram.board

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
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
    puzzle: PuzzleData,
    modifier: Modifier = Modifier,
) {
    var state by remember(puzzle) { mutableStateOf(BoardState.forPuzzle(puzzle)) }
    val colors = ChronicleTheme.colors

    // Deselecting is a real back action -- it must not close the app.
    BackHandler(enabled = state.selectedCellId != null) {
        state = state.copy(selectedCellId = null)
    }

    Column(
        modifier = modifier
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
                        state = BoardActions.backspace(state); true
                    }
                    else -> {
                        val letter = LetterKeys[event.key]
                        if (letter != null) {
                            state = BoardActions.type(state, letter); true
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
                    // A reading measure, so a tablet does not stretch the board
                    // to the full width of the screen.
                    .widthIn(max = 720.dp)
                    .align(Alignment.CenterHorizontally),
            ) {
                CipherBoard(
                    words = state.words,
                    mappings = state.mappings,
                    selectedCellId = state.selectedCellId,
                    lockedSymbolIds = state.lockedSymbolIds,
                    flaggedSymbolIds = state.flaggedSymbolIds,
                    onCellClick = { cellId, _ -> state = BoardActions.select(state, cellId) },
                )
            }
        }

        if (state.isSolved) {
            SolvedNotice(Modifier.fillMaxWidth())
        } else {
            DeskDock(
                state = state,
                onHint = { state = BoardActions.hint(state) },
                onCheck = { state = BoardActions.check(state) },
                onClear = { state = BoardActions.clearLetters(state) },
            )
            TypewriterKeyboard(
                onLetter = { state = BoardActions.type(state, it) },
                onBackspace = { state = BoardActions.backspace(state) },
            )
        }
    }
}

@Composable
private fun Masthead(puzzle: PuzzleData) {
    val colors = ChronicleTheme.colors
    Column(Modifier.padding(bottom = 16.dp)) {
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

@Composable
private fun SolvedNotice(modifier: Modifier = Modifier) {
    val colors = ChronicleTheme.colors
    Box(
        modifier
            .background(colors.paperMasthead)
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "DECODED",
            style = MaterialTheme.typography.displayMedium,
            color = colors.brass,
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
