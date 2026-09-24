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
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.Solve
import com.chroniclecryptogram.cipher.model.Wallets
import com.chroniclecryptogram.data.PuzzleLiveStats
import com.chroniclecryptogram.data.derivePublicStats
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

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
    /** Mints another drill. Offered on the Primer and on drills, nowhere else. */
    onPractice: (() -> Unit)? = null,
    /** The public counters for this puzzle, or null before they have loaded. */
    liveStats: PuzzleLiveStats? = null,
    /** The next page's headline, and only its headline: the question the agent leaves with. */
    nextHeadline: String? = null,
) {
    val colors = ChronicleTheme.colors
    val context = LocalContext.current

    val hintsUsed = state.hintsUsed
    val checksUsed = state.checksUsed
    // Whole seconds: the time is a record, not a race, so the tenths don't print.
    val time = state.timeFormatted.substringBeforeLast('.')
    val practice = Edition.isPracticePuzzle(state.puzzle)

    Column(
        modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            // A drill says so. Being told "DECODED" for something that changed
            // no counter and unlocked nothing reads as a bug.
            text = if (practice) "DRILL DECODED" else "DECODED",
            style = MaterialTheme.typography.displayMedium,
            color = colors.brass,
        )
        Text(
            text = state.puzzle.originalText,
            style = MaterialTheme.typography.bodyLarge,
            color = colors.ink,
        )
        Text(
            text = "${Solve.helpLine(hintsUsed, checksUsed)} · Time on desk $time",
            style = MaterialTheme.typography.labelLarge,
            color = colors.ink,
            modifier = Modifier.semantics {
                contentDescription =
                    (if (hintsUsed == 0 && checksUsed == 0) "Clean, no hints or checks"
                    else "$hintsUsed hints, $checksUsed checks") + ", solved in $time"
            },
        )

        // Only once figures have actually been fetched. Null is "not asked" --
        // an offline build never asks -- and rendering the row anyway printed
        // three em dashes, which reads as "nobody has solved this" rather than
        // as an absent feature.
        if (liveStats != null) LiveStatsRow(liveStats)

        if (nextHeadline != null && !practice) {
            Text(
                text = "NEXT ON THE WIRE",
                style = MaterialTheme.typography.labelLarge,
                color = colors.brass,
            )
            Text(
                text = nextHeadline,
                style = MaterialTheme.typography.titleMedium,
                color = colors.ink,
                modifier = Modifier.semantics { contentDescription = "Next on the wire: $nextHeadline" },
            )
        }

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
                            hintsUsed,
                            checksUsed,
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
                                    hintsUsed = hintsUsed,
                                    checksUsed = checksUsed,
                                ),
                            )
                        }.getOrNull(),
                    )
                },
                modifier = Modifier.semantics { contentDescription = "Share this solve" },
            ) {
                Text("Share", color = colors.ink)
            }

            if (onPractice != null) {
                TextButton(
                    onClick = onPractice,
                    modifier = Modifier.semantics {
                        contentDescription = "Start another practice drill"
                    },
                ) {
                    Text(if (practice) "Another drill" else "Practice drill", color = colors.ink)
                }
            }

            // A drill leads nowhere, so it offers no next edition: the way on is
            // the Primer's own, which the player already has.
            if (onNext != null && !practice) {
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

    Row(
        modifier
            .fillMaxWidth()
            .padding(top = 4.dp)
            .testTag(LiveStatsTag),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
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
            style = MaterialTheme.typography.labelLarge,
            fontSize = 9.sp,
            color = colors.brass,
            maxLines = 1,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelLarge,
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
