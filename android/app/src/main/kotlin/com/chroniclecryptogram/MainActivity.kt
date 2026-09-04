package com.chroniclecryptogram

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.chroniclecryptogram.board.BoardScreen
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.content.ContentRepository
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.EditionSlot

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

    // Boot puzzle: the Primer if it exists, else edition one's morning.
    // Progression gating replaces this once persistence lands.
    val puzzle = remember(puzzles) {
        puzzles.firstOrNull { Edition.isPrimerPuzzle(it) }
            ?: Edition.morningPuzzleForEdition(puzzles, 1)
            ?: puzzles.first()
    }

    val slot = if (Edition.isNightEdition(puzzle)) EditionSlot.Evening else EditionSlot.Morning

    ChronicleTheme(dark = isSystemInDarkTheme(), slot = slot) {
        BoardScreen(puzzle)
    }
}
