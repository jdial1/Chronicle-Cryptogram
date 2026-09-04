package com.chroniclecryptogram.archive

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.Issue
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/** Test handle for the issue list, which is lazy and only composes what is visible. */
const val ArchiveListTag = "archive-list"

/**
 * Every issue in the season, locked or not.
 *
 * Lock state is derived, never stored: an edition above the front page is
 * locked, and a Night Extra is locked until its own Morning is solved. That is
 * the entire gating model, and it lives in [Edition] where it is fixture-tested
 * against the TypeScript.
 *
 * The web version also rendered an "upcoming issue" card driven by a one-second
 * interval, counting down to a release time. Progression gating has no clock, so
 * there is nothing to count down to and the card does not come across.
 */
@Composable
fun ArchiveScreen(
    puzzles: List<PuzzleData>,
    solvedPuzzleIds: Set<String>,
    onOpen: (PuzzleData) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val issues = remember(puzzles) { Edition.groupIssues(puzzles) }
    val frontPage = remember(puzzles, solvedPuzzleIds) {
        Edition.frontPageEdition(puzzles, solvedPuzzleIds.toList())
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .testTag(ArchiveListTag),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            // Every screen states what it is. Archive and the case file were the
            // only two that dropped the reader straight into cards.
            Text(
                text = "The Archive",
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
                modifier = Modifier
                    .padding(bottom = 4.dp)
                    .semantics { heading() },
            )
        }

        items(issues, key = { it.editionNumber }) { issue ->
            IssueRow(
                issue = issue,
                unlocked = issue.editionNumber <= frontPage,
                solvedPuzzleIds = solvedPuzzleIds,
                onOpen = onOpen,
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 720.dp),
            )
        }
    }
}

@Composable
private fun IssueRow(
    issue: Issue,
    unlocked: Boolean,
    solvedPuzzleIds: Set<String>,
    onOpen: (PuzzleData) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val chapter = Edition.chapterForEdition(issue.editionNumber)

    Column(
        modifier
            .clip(RoundedCornerShape(6.dp))
            .background(colors.paperCard)
            .padding(12.dp),
    ) {
        Text(
            text = Edition.editionLabel(issue.editionNumber),
            style = MaterialTheme.typography.titleMedium,
            color = colors.ink,
        )
        Text(
            text = "${chapter.kicker} · ${chapter.title}",
            style = MaterialTheme.typography.labelLarge,
            color = colors.brass,
        )

        Row(
            Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            issue.morning?.let { morning ->
                SlotChip(
                    label = "Morning",
                    puzzle = morning,
                    // The Morning is open as soon as its edition is reached.
                    unlocked = unlocked,
                    solved = morning.id in solvedPuzzleIds,
                    onOpen = onOpen,
                )
            }
            issue.night?.let { night ->
                SlotChip(
                    label = "Night Extra",
                    puzzle = night,
                    // The Night Extra needs its own Morning solved first.
                    unlocked = unlocked && issue.morning?.id in solvedPuzzleIds,
                    solved = night.id in solvedPuzzleIds,
                    onOpen = onOpen,
                )
            }
        }
    }
}

@Composable
private fun SlotChip(
    label: String,
    puzzle: PuzzleData,
    unlocked: Boolean,
    solved: Boolean,
    onOpen: (PuzzleData) -> Unit,
) {
    val colors = ChronicleTheme.colors
    // Lock wins over solved. A save can carry a solve for an edition the player
    // has not reached -- editions 1, 2 and 4 solved leaves 4 locked behind 3 --
    // and in that case what matters is that the row cannot be opened.
    val state = when {
        !unlocked -> "locked"
        solved -> "decoded"
        else -> "open"
    }

    Text(
        text = if (solved) "$label ✓" else label,
        style = MaterialTheme.typography.bodyMedium,
        color = when {
            solved -> colors.brass
            unlocked -> colors.ink
            else -> colors.paperRule
        },
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(if (unlocked) colors.paperMasthead else colors.paperSheet)
            .then(
                if (unlocked) Modifier.clickable { onOpen(puzzle) } else Modifier
            )
            // 48dp is Android's minimum touch target; the chip was about 34dp.
            .heightIn(min = 48.dp)
            .padding(horizontal = 14.dp)
            .wrapContentHeight(Alignment.CenterVertically)
            .semantics {
                contentDescription =
                    "$label, ${Edition.editionLabel(puzzle.editionNumber)}, $state"
            },
    )
}
