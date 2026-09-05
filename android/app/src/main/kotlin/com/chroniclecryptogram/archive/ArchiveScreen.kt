package com.chroniclecryptogram.archive

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import com.chroniclecryptogram.designsystem.ChroniclePanel
import com.chroniclecryptogram.designsystem.ReadingMeasure
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.casefile.WoodcutPlate
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.Issue
import com.chroniclecryptogram.cipher.model.IssueChapter
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/** Test handle for the issue list, which is lazy and only composes what is visible. */
const val ArchiveListTag = "archive-list"

/** Test handle for one edition's collapsed row, which must be expanded to reach its slots. */
fun issueRowTag(editionNumber: Int) = "issue-row-$editionNumber"

/**
 * Every issue in the season, locked or not.
 *
 * Lock state is derived, never stored: an edition above the front page is
 * locked, and a Night Extra is locked until its own Morning is solved. That is
 * the entire gating model, and it lives in [Edition] where it is fixture-tested
 * against the TypeScript.
 *
 * The list is grouped under chapter headings and collapsed to one line per
 * edition, the way the web archive reads. Thirty editions as open cards is a
 * scroll with no landmarks; grouped and collapsed, the season has a shape.
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

    // One row open at a time. Two expanded rows on a phone push the rest off
    // screen and lose the overview the grouping just bought.
    var expanded by remember { mutableStateOf<Int?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .testTag(ArchiveListTag),
        contentPadding = PaddingValues(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item {
            // Every screen states what it is. Archive and the case file were the
            // only two that dropped the reader straight into cards.
            Text(
                text = "The Archive",
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
                modifier = Modifier
                    .padding(bottom = 8.dp)
                    .semantics { heading() },
            )
        }

        var lastChapter: IssueChapter? = null
        issues.forEach { issue ->
            val chapter = Edition.chapterForEdition(issue.editionNumber)
            if (chapter != lastChapter) {
                lastChapter = chapter
                item(key = "chapter-${chapter.week}") { ChapterHeading(chapter) }
            }

            item(key = issue.editionNumber) {
                IssueRow(
                    issue = issue,
                    unlocked = issue.editionNumber <= frontPage,
                    solvedPuzzleIds = solvedPuzzleIds,
                    expanded = expanded == issue.editionNumber,
                    onToggle = {
                        expanded = if (expanded == issue.editionNumber) null else issue.editionNumber
                    },
                    onOpen = onOpen,
                    modifier = Modifier,
                )
            }
        }
    }
}

/** Where one chapter of the season starts. */
@Composable
private fun ChapterHeading(chapter: IssueChapter) {
    val colors = ChronicleTheme.colors
    Column(Modifier.fillMaxWidth().padding(top = 20.dp, bottom = 6.dp)) {
        Text(
            text = chapter.kicker.uppercase(),
            style = MaterialTheme.typography.labelLarge,
            color = colors.brass,
        )
        Text(
            text = chapter.title,
            style = MaterialTheme.typography.titleMedium,
            color = colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        HorizontalDivider(Modifier.padding(top = 4.dp), color = colors.paperRule)
    }
}

/**
 * One edition, collapsed to a line: its plate, its label, whether it is locked,
 * and a dot per slot showing how far the player got.
 */
@Composable
private fun IssueRow(
    issue: Issue,
    unlocked: Boolean,
    solvedPuzzleIds: Set<String>,
    expanded: Boolean,
    onToggle: () -> Unit,
    onOpen: (PuzzleData) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val morningSolved = issue.morning?.id in solvedPuzzleIds
    // The Night Extra needs its own Morning solved first.
    val nightUnlocked = unlocked && morningSolved
    val nightSolved = issue.night?.id in solvedPuzzleIds
    val label = Edition.editionLabel(issue.editionNumber)

    ChroniclePanel(
        modifier = modifier.padding(vertical = 3.dp),
        border = colors.paperRule,
        corner = 4.dp,
        contentPadding = PaddingValues(0.dp),
        verticalArrangement = Arrangement.Top,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggle)
                .heightIn(min = 56.dp)
                .testTag(issueRowTag(issue.editionNumber))
                .padding(horizontal = 10.dp, vertical = 6.dp)
                .semantics {
                    contentDescription = buildString {
                        append(label)
                        append(if (unlocked) ", unlocked" else ", locked")
                        append(if (morningSolved) ", morning decoded" else ", morning open")
                        if (issue.night != null) {
                            append(if (nightSolved) ", night extra decoded" else ", night extra")
                        }
                        append(if (expanded) ", expanded" else ", collapsed")
                    }
                },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            issue.morning?.silhouette?.let { WoodcutPlate(it, Modifier.size(28.dp)) }

            Text(
                text = label,
                style = MaterialTheme.typography.titleMedium,
                color = if (unlocked) colors.ink else colors.paperRule,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )

            if (!unlocked) {
                Icon(
                    Icons.Filled.Lock,
                    contentDescription = null,
                    tint = colors.paperRule,
                    modifier = Modifier.size(16.dp),
                )
            }

            SlotDot(solved = morningSolved, unlocked = unlocked)
            if (issue.night != null) SlotDot(solved = nightSolved, unlocked = nightUnlocked)

            Icon(
                imageVector = if (expanded) {
                    Icons.Filled.KeyboardArrowUp
                } else {
                    Icons.Filled.KeyboardArrowDown
                },
                contentDescription = null,
                tint = colors.brass,
            )
        }

        AnimatedVisibility(expanded) {
            Column(
                Modifier.padding(start = 10.dp, end = 10.dp, bottom = 10.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                issue.morning?.let { morning ->
                    SlotCard(
                        slot = "Morning Edition",
                        puzzle = morning,
                        unlocked = unlocked,
                        solved = morningSolved,
                        lockReason = "Decode the editions before this one to unlock.",
                        onOpen = onOpen,
                    )
                }
                issue.night?.let { night ->
                    SlotCard(
                        slot = "Night Extra",
                        puzzle = night,
                        unlocked = nightUnlocked,
                        solved = nightSolved,
                        lockReason = "Decode the Morning Edition to unlock.",
                        onOpen = onOpen,
                    )
                }
            }
        }
    }
}

/** Filled when the slot is decoded, hollow when it is open, faint when locked. */
@Composable
private fun SlotDot(solved: Boolean, unlocked: Boolean) {
    val colors = ChronicleTheme.colors
    Box(
        Modifier
            .size(11.dp)
            .clip(CircleShape)
            .background(if (solved) colors.brass else colors.paperCard)
            .border(
                width = 1.5.dp,
                color = if (unlocked) colors.brass else colors.paperRule,
                shape = CircleShape,
            )
    )
}

/**
 * One slot of an edition, with its headline.
 *
 * A locked slot still shows why it is locked rather than only that it is --
 * "decode the Morning Edition" is an instruction, a padlock on its own is not.
 */
@Composable
private fun SlotCard(
    slot: String,
    puzzle: PuzzleData,
    unlocked: Boolean,
    solved: Boolean,
    lockReason: String,
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

    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(3.dp))
            .background(if (unlocked) colors.paperMasthead else colors.paperSheet)
            .then(if (unlocked) Modifier.clickable { onOpen(puzzle) } else Modifier)
            .heightIn(min = 56.dp)
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .semantics {
                contentDescription =
                    "$slot, ${Edition.editionLabel(puzzle.editionNumber)}, $state"
            },
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = slot.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = colors.brass,
            )
            if (solved) {
                Icon(
                    Icons.Filled.Check,
                    contentDescription = null,
                    tint = colors.brass,
                    modifier = Modifier.size(14.dp),
                )
            }
            if (!unlocked) {
                Icon(
                    Icons.Filled.Lock,
                    contentDescription = null,
                    tint = colors.paperRule,
                    modifier = Modifier.size(14.dp),
                )
            }
        }
        Text(
            text = if (unlocked) puzzle.headline else lockReason,
            style = MaterialTheme.typography.bodyMedium,
            color = if (unlocked) colors.ink else colors.paperRule,
        )
    }
}
