package com.chroniclecryptogram

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.board.CipherBoard
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.PuzzleState
import com.chroniclecryptogram.content.ContentRepository
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.EditionSlot

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Draws behind the system bars. Replaces the whole edge-to-edge config
        // plugin the Expo shell needed, and the --safe-* variables it injected
        // into the WebView.
        enableEdgeToEdge()
        setContent { ChronicleApp() }
    }
}

@Composable
private fun ChronicleApp() {
    val context = LocalContext.current
    val repository = remember { ContentRepository(context.assets) }
    val puzzles = remember { repository.puzzles() }

    // Boot puzzle: the Primer if it exists, else the first morning edition.
    val puzzle = remember(puzzles) {
        puzzles.firstOrNull { Edition.isPrimerPuzzle(it) }
            ?: Edition.morningPuzzleForEdition(puzzles, 1)
            ?: puzzles.first()
    }
    val cipher = remember(puzzle) { PuzzleState.cipherForPuzzle(puzzle) }

    var mappings by remember { mutableStateOf(emptyMap<String, String>()) }
    var selectedCellId by remember { mutableStateOf<String?>(null) }

    val dark = androidx.compose.foundation.isSystemInDarkTheme()
    val slot = if (Edition.isNightEdition(puzzle)) EditionSlot.Evening else EditionSlot.Morning

    ChronicleTheme(dark = dark, slot = slot) {
        val colors = ChronicleTheme.colors
        Column(
            Modifier
                .fillMaxSize()
                .background(colors.paper)
                // safeDrawingPadding covers status bar, navigation bar and
                // cutouts; imePadding tracks the keyboard as a measured, animated
                // inset rather than the web build's `innerHeight - visualViewport
                // > 120` guess.
                .safeDrawingPadding()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            Text(
                text = puzzle.headline,
                style = androidx.compose.material3.MaterialTheme.typography.displayMedium,
                color = colors.ink,
            )
            Text(
                text = Edition.editionLabel(puzzle.editionNumber) +
                    " · " + Edition.chapterForEdition(puzzle.editionNumber).title,
                style = androidx.compose.material3.MaterialTheme.typography.labelLarge,
                color = colors.brass,
                modifier = Modifier.padding(bottom = 20.dp),
            )

            CipherBoard(
                words = cipher.words,
                mappings = mappings,
                selectedCellId = selectedCellId,
                lockedSymbolIds = emptySet(),
                flaggedSymbolIds = emptySet(),
                onCellClick = { cellId, _ -> selectedCellId = cellId },
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}
