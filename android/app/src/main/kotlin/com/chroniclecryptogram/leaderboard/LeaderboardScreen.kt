package com.chroniclecryptogram.leaderboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Solve
import com.chroniclecryptogram.data.LeaderboardStanding
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val LeaderboardListTag = "leaderboard-list"

/** What the board is doing, so the screen can say so rather than showing nothing. */
sealed interface BoardState {
    data object Loading : BoardState
    data object Offline : BoardState
    data class Ready(val standing: LeaderboardStanding) : BoardState
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
    state: BoardState,
    playerUid: String?,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors

    Column(
        modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding(),
    ) {
        Text(
            text = "The Bureau Board",
            style = MaterialTheme.typography.displayMedium,
            color = colors.ink,
            modifier = Modifier.padding(16.dp),
        )

        when (state) {
            BoardState.Loading -> Notice("Reading the wire…")

            BoardState.Offline -> Notice(
                "The wire is down. Times post when the connection returns.",
            )

            is BoardState.Ready -> {
                if (state.standing.entries.isEmpty()) {
                    Notice("No times filed for this edition yet.")
                } else {
                    LazyColumn(
                        Modifier.weight(1f).testTag(LeaderboardListTag),
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        itemsIndexed(
                            state.standing.entries,
                            key = { _, entry -> entry.uid },
                        ) { index, entry ->
                            EntryRow(
                                rank = index + 1,
                                codename = entry.codename,
                                time = Solve.formatTime(entry.timeSeconds.toDouble()),
                                hints = entry.hintsUsed,
                                isPlayer = entry.uid == playerUid,
                            )
                        }
                    }
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

@Composable
private fun Notice(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyLarge,
        color = ChronicleTheme.colors.ink,
        modifier = Modifier.padding(horizontal = 16.dp),
    )
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
