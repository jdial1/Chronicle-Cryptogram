package com.chroniclecryptogram.board

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Solve
import com.chroniclecryptogram.cipher.model.Wallets
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * What the player sees on solving: the decoded headline, their numbers, and the
 * way out.
 *
 * The share card is built in `:core:cipher` and fixture-pinned against the web,
 * so the same solve reads identically wherever it is posted from.
 */
@Composable
fun SolveBulletin(
    state: BoardState,
    onNext: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val context = LocalContext.current

    val accuracy = Solve.accuracy(state.mappings, state.answer)
    val hintsUsed = Wallets.DAILY_HINTS - state.hintsRemaining
    val time = Solve.formatTime(state.timerSeconds)

    Column(
        modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = "DECODED",
            style = MaterialTheme.typography.displayMedium,
            color = colors.brass,
        )
        Text(
            text = state.puzzle.originalText,
            style = MaterialTheme.typography.bodyLarge,
            color = colors.ink,
        )
        Text(
            text = "Time $time · Accuracy $accuracy% · Hints $hintsUsed",
            style = MaterialTheme.typography.labelLarge,
            color = colors.ink,
            modifier = Modifier.semantics {
                contentDescription =
                    "Solved in $time, accuracy $accuracy percent, $hintsUsed hints used"
            },
        )

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(
                onClick = {
                    context.shareSolve(
                        Solve.shareText(state.puzzle, state.timerSeconds, accuracy, hintsUsed)
                    )
                },
                modifier = Modifier.semantics { contentDescription = "Share this solve" },
            ) {
                Text("Share", color = colors.ink)
            }

            if (onNext != null) {
                TextButton(
                    onClick = onNext,
                    modifier = Modifier.semantics { contentDescription = "Open the next edition" },
                ) {
                    Text("Next edition", color = colors.ink)
                }
            }
        }
    }
}

/**
 * The system share sheet. Replaces the web's three-way ladder -- post a message
 * to the Android shell, else `navigator.share`, else copy to the clipboard and
 * show a "copied" toast for 2.5 seconds -- with the one thing Android has.
 */
private fun Context.shareSolve(text: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TITLE, "Chronicle Cryptogram")
        putExtra(Intent.EXTRA_TEXT, text)
    }
    startActivity(Intent.createChooser(intent, null))
}
