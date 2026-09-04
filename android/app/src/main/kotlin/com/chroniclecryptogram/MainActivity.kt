package com.chroniclecryptogram

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.chroniclecryptogram.board.BoardScreen
import com.chroniclecryptogram.board.BoardViewModel
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.content.ContentRepository
import com.chroniclecryptogram.data.DataStoreDeskStore
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
    val puzzles = remember { ContentRepository(context.assets).puzzles() }
    val store = remember { DataStoreDeskStore.create(context.applicationContext) }

    val model: BoardViewModel = viewModel(
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                BoardViewModel(store, puzzles) as T
        }
    )

    LaunchedEffect(Unit) { model.open() }
    val state by model.state.collectAsStateWithLifecycle()

    val slot = when {
        state == null -> EditionSlot.Morning
        Edition.isNightEdition(state!!.puzzle) -> EditionSlot.Evening
        else -> EditionSlot.Morning
    }

    ChronicleTheme(dark = isSystemInDarkTheme(), slot = slot) {
        val board = state
        if (board == null) {
            // The desk is read from disk before the first frame; a blank paper
            // ground is better than a flash of an empty board.
            Box(Modifier.fillMaxSize())
        } else {
            BoardScreen(state = board, onAction = model::act)
        }
    }
}
