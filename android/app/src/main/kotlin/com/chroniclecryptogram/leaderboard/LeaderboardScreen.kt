package com.chroniclecryptogram.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Solve
import com.chroniclecryptogram.data.LeaderboardStanding
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val LeaderboardListTag = "leaderboard-list"

/** How many rows the embedded board shows before summarising the rest. */
private const val BOARD_ROWS = 25

/** What the board is doing, so the screen can say so rather than showing nothing. */
/**
 * Named for what it holds rather than for the screen that shows it: this used to
 * be `BoardState`, which is also the name of the cipher board's state, so every
 * file that touched both had to import one of them under an alias.
 */
sealed interface StandingsState {
    data object Loading : StandingsState
    data object Offline : StandingsState
    data class Ready(val standing: LeaderboardStanding) : StandingsState
}

/**
 * Times other solvers have posted.
 *
 * Every figure here is asserted by the client that posted it. `firestore.rules`
 * range-checks them but cannot verify them, so **nothing on this screen may call
 * a time verified or certified** -- the web carried exactly that copy, it was a
 * false claim in a paid app, and it was removed. The footer describes what the
 * board actually is.
 */
@Composable
fun LeaderboardScreen(
    state: StandingsState,
    playerUid: String?,
    modifier: Modifier = Modifier,
    /** Why the last posting did not go through, when it did not. */
    note: String? = null,
) {
    val colors = ChronicleTheme.colors

    // Width, not size: this board is embedded in the Bureau's scrolling list, so
    // it is measured with an unbounded height. fillMaxSize resolved to nothing
    // there and every weight(1f) below it collapsed to zero.
    Column(modifier.fillMaxWidth().background(colors.paper)) {
        Text(
            text = "The Bureau Board",
            style = MaterialTheme.typography.displayMedium,
            color = colors.ink,
            modifier = Modifier.padding(16.dp),
        )

        note?.let { message ->
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.cinnabar,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
        }

        when (state) {
            StandingsState.Loading -> Notice("Reading the wire…")

            StandingsState.Offline -> Notice(
                "The wire is down. Times post when the connection returns.",
            )

            is StandingsState.Ready -> {
                if (state.standing.entries.isEmpty()) {
                    Notice("No times filed for this edition yet.")
                } else {
                    // A plain Column, not a LazyColumn: a vertical scroller
                    // inside the Bureau's vertical scroller is measured with an
                    // infinite height and throws. The board is capped instead.
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .testTag(LeaderboardListTag),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        state.standing.entries.take(BOARD_ROWS)
                            .forEachIndexed { index, entry ->
                                EntryRow(
                                    rank = index + 1,
                                    codename = entry.codename,
                                    time = Solve.formatTime(entry.timeSeconds.toDouble()),
                                    hints = entry.hintsUsed,
                                    isPlayer = entry.uid == playerUid,
                                )
                            }

                        val hidden = state.standing.entries.size - BOARD_ROWS
                        if (hidden > 0) {
                            Text(
                                text = "and $hidden more.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.paperRule,
                            )
                        }
                    }
                }

                state.standing.playerRank?.let { rank ->
                    Text(
                        text = "You stand $rank of ${state.standing.entries.size}.",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.brass,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    )
                }

                Text(
                    // Not "certified", not "verified". Times are as filed.
                    text = "Times as filed by solvers.",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.paperRule,
                    modifier = Modifier.padding(16.dp),
                )
            }
        }
    }
}

/**
 * An empty or offline board, centred in a reserved band. Left flush at the top it
 * read as a screen that had failed to finish loading rather than one with
 * nothing to show.
 */
@Composable
private fun Notice(text: String) {
    Box(
        Modifier
            .fillMaxWidth()
            // A minimum rather than a weight, for the same reason: there is no
            // leftover space to take a share of inside a scrolling parent.
            .heightIn(min = 96.dp)
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyLarge,
            color = ChronicleTheme.colors.paperRule,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun EntryRow(
    rank: Int,
    codename: String,
    time: String,
    hints: Int,
    isPlayer: Boolean,
) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(4.dp))
            .background(if (isPlayer) colors.selected else colors.paperCard)
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .semantics {
                contentDescription = buildString {
                    append("Rank $rank, $codename, $time, $hints hints")
                    if (isPlayer) append(", your time")
                }
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "$rank",
            style = MaterialTheme.typography.titleMedium,
            color = colors.brass,
        )
        Text(
            text = codename,
            style = MaterialTheme.typography.bodyLarge,
            color = if (isPlayer) colors.selectedInk else colors.ink,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = time,
            style = MaterialTheme.typography.labelLarge,
            color = if (isPlayer) colors.selectedInk else colors.ink,
        )
    }
}
