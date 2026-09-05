package com.chroniclecryptogram.board

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.border
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.sp
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
import com.chroniclecryptogram.data.PuzzleLiveStats
import com.chroniclecryptogram.data.derivePublicStats
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.ChronicleTypography

/** Test handle for the public counters row. */
const val LiveStatsTag = "live-stats"

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
    /** The public counters for this puzzle, or null before they have loaded. */
    liveStats: PuzzleLiveStats? = null,
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

        // Only once figures have actually been fetched. Null is "not asked" --
        // an offline build never asks -- and rendering the row anyway printed
        // three em dashes, which reads as "nobody has solved this" rather than
        // as an absent feature.
        if (liveStats != null) LiveStatsRow(liveStats)

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(
                onClick = {
                    context.shareSolve(
                        text = Solve.shareText(
                            state.puzzle,
                            state.timerSeconds,
                            accuracy,
                            hintsUsed,
                        ),
                        // The clipping is a nicety, not the payload: if it
                        // cannot be drawn or written, the text still shares.
                        clipping = runCatching {
                            Clipping.share(
                                context,
                                Clipping.render(
                                    context = context,
                                    puzzle = state.puzzle,
                                    time = time,
                                    accuracy = accuracy,
                                    hintsUsed = hintsUsed,
                                ),
                            )
                        }.getOrNull(),
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
 * How this edition has gone for everyone else.
 *
 * Every figure is aggregated from what solvers reported about themselves. The
 * rules constrain how the counters may move but cannot verify a reported time,
 * so the footer says "as filed" and nothing here calls them verified.
 */
@Composable
fun LiveStatsRow(liveStats: PuzzleLiveStats?, modifier: Modifier = Modifier) {
    val colors = ChronicleTheme.colors
    val stats = liveStats.derivePublicStats()

    // An em dash rather than a zero: before anyone has solved it, "0" would be a
    // claim about the edition rather than an absence of data.
    val blank = "—"

    Row(
        modifier
            .fillMaxWidth()
            .padding(top = 4.dp)
            .testTag(LiveStatsTag),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        StatCell(
            label = "Quickest",
            value = if (stats.hasSolves) Solve.formatTime(stats.quickestSolveTime.toDouble()) else blank,
            modifier = Modifier.weight(1f),
        )
        StatCell(
            label = "Solvers",
            value = "${stats.totalSolvers}",
            modifier = Modifier.weight(1f),
        )
        StatCell(
            label = "Rate",
            value = "${stats.solveRatePercentage}%",
            modifier = Modifier.weight(1f),
        )
        StatCell(
            label = "Average",
            value = if (stats.hasSolves) Solve.formatTime(stats.averageTimeSeconds) else blank,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun StatCell(label: String, value: String, modifier: Modifier = Modifier) {
    val colors = ChronicleTheme.colors
    Column(
        modifier
            .background(colors.paper)
            .border(1.dp, colors.paperRule)
            .padding(vertical = 6.dp, horizontal = 4.dp)
            .semantics { contentDescription = "$label, $value" },
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label.uppercase(),
            style = ChronicleTypography.labelLarge,
            fontSize = 9.sp,
            color = colors.brass,
            maxLines = 1,
        )
        Text(
            text = value,
            style = ChronicleTypography.labelLarge,
            fontSize = 13.sp,
            color = colors.ink,
            maxLines = 1,
        )
    }
}

/**
 * The system share sheet. Replaces the web's three-way ladder -- post a message
 * to the Android shell, else `navigator.share`, else copy to the clipboard and
 * show a "copied" toast for 2.5 seconds -- with the one thing Android has.
 */
private fun Context.shareSolve(text: String, clipping: android.net.Uri? = null) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        // image/png when there is a clipping, so galleries and chat apps offer
        // themselves; the text rides along for anything that prefers words.
        type = if (clipping != null) "image/png" else "text/plain"
        putExtra(Intent.EXTRA_TITLE, "Chronicle Cryptogram")
        putExtra(Intent.EXTRA_TEXT, text)
        if (clipping != null) {
            putExtra(Intent.EXTRA_STREAM, clipping)
            // Without this the receiving app cannot read the URI it was handed.
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }
    startActivity(Intent.createChooser(intent, null))
}
