package com.chroniclecryptogram.archive

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import com.chroniclecryptogram.designsystem.PaperList
import com.chroniclecryptogram.designsystem.ChroniclePanel
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
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
import com.chroniclecryptogram.cipher.PrimerPractice
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
    val practiceCard = remember(puzzles) { PrimerPractice.archiveCard(puzzles) }
    val frontPage = remember(puzzles, solvedPuzzleIds) {
        Edition.frontPageEdition(puzzles, solvedPuzzleIds.toList())
    }

    // One row open at a time. Two expanded rows on a phone push the rest off
    // screen and lose the overview the grouping just bought.
    var expanded by remember { mutableStateOf<Int?>(null) }

    val grouped = remember(issues) {
        issues.groupBy { Edition.chapterForEdition(it.editionNumber) }.toList()
    }

    PaperList(
        title = "The Archive",
        testTag = ArchiveListTag,
        modifier = modifier,
        // Tighter than the other pages: the Archive is a list of thirty rows
        // rather than a handful of cards, and twelve between each turns it into
        // a scroll.
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {

        for ((chapter, chapterIssues) in grouped) {
            // A chapter the player cannot reach any of is a spoiler in list
            // form: thirty locked rows tell them how long the season is and
            // nothing else. It keeps its heading and a count until the first
            // edition in it opens.
            val reachable = chapterIssues.any { it.editionNumber <= frontPage }

            item(key = "chapter-${chapter.week}") {
                ChapterHeading(chapter, locked = !reachable, editions = chapterIssues.size)
            }

            if (!reachable) continue

            items(chapterIssues, key = { it.editionNumber }) { issue ->
                val unlocked = issue.editionNumber <= frontPage
                IssueRow(
                    issue = issue,
                    practiceCard = practiceCard,
                    unlocked = unlocked,
                    solvedPuzzleIds = solvedPuzzleIds,
                    expanded = unlocked && expanded == issue.editionNumber,
                    // A locked row has nothing behind it but the headline of an
                    // edition the player has not reached, so it does not open.
                    onToggle = if (!unlocked) null else ({
                        expanded = if (expanded == issue.editionNumber) null else issue.editionNumber
                    }),
                    onOpen = onOpen,
                    modifier = Modifier,
                )
            }
        }
    }
}

/** Where one chapter of the season starts. */
@Composable
private fun ChapterHeading(chapter: IssueChapter, locked: Boolean, editions: Int) {
    val colors = ChronicleTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 20.dp, bottom = 6.dp)
            .semantics {
                contentDescription = if (locked) {
                    "${chapter.title}, locked, $editions editions"
                } else {
                    chapter.title
                }
            },
    ) {
        Text(
            text = chapter.kicker.uppercase(),
            style = MaterialTheme.typography.labelLarge,
            color = colors.brass,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = chapter.title,
                style = MaterialTheme.typography.titleMedium,
                // Dimmed rather than hidden: the chapter titles are part of the
                // season's shape, and a player should be able to see there is
                // more ahead without being shown every edition in it.
                color = if (locked) colors.paperRule else colors.ink,
                modifier = Modifier
                    .weight(1f)
                    .semantics { heading() },
            )
            if (locked) {
                Icon(
                    Icons.Filled.Lock,
                    contentDescription = null,
                    tint = colors.paperRule,
                    modifier = Modifier.size(14.dp),
                )
                Text(
                    text = if (editions == 1) "1 edition" else "$editions editions",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.paperRule,
                    modifier = Modifier.padding(start = 4.dp),
                )
            }
        }
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
    /** The Primer's drill slot, where other editions have a Night Extra. */
    practiceCard: PuzzleData?,
    unlocked: Boolean,
    solvedPuzzleIds: Set<String>,
    expanded: Boolean,
    /** Null when the edition is locked: there is nothing behind it to show. */
    onToggle: (() -> Unit)?,
    onOpen: (PuzzleData) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val morningSolved = issue.morning?.id in solvedPuzzleIds
    // The Night Extra needs its own Morning solved first.
    val nightUnlocked = unlocked && morningSolved
    val nightSolved = issue.night?.id in solvedPuzzleIds
    val label = Edition.editionLabel(issue.editionNumber)

    // The Primer has no Night Extra. Its second slot is a drill: unlimited,
    // never solved, and unlocked by finishing the Primer itself.
    val practice = practiceCard.takeIf { issue.editionNumber == 0 }
    val extraUnlocked = if (practice != null) unlocked && morningSolved else nightUnlocked
    val hasExtra = practice != null || issue.night != null

    ChroniclePanel(
        modifier = modifier,
        border = colors.paperRule,
        corner = 4.dp,
        contentPadding = PaddingValues(0.dp),
        verticalArrangement = Arrangement.Top,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .then(
                    if (onToggle == null) Modifier else Modifier.clickable(onClick = onToggle)
                )
                .heightIn(min = 56.dp)
                .testTag(issueRowTag(issue.editionNumber))
                .padding(horizontal = 10.dp, vertical = 6.dp)
                .semantics {
                    contentDescription = buildString {
                        append(label)
                        append(if (unlocked) ", unlocked" else ", locked")
                        append(if (morningSolved) ", morning decoded" else ", morning open")
                        if (practice != null) {
                            append(if (extraUnlocked) ", practice drill" else ", practice locked")
                        } else if (issue.night != null) {
                            append(if (nightSolved) ", night extra decoded" else ", night extra")
                        }
                        // A locked row does not open, so it does not announce
                        // a state it cannot be in.
                        if (onToggle != null) {
                            append(if (expanded) ", expanded" else ", collapsed")
                        }
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
            // A drill is never "solved" -- there is always another one -- so its
            // dot only ever reports whether it can be opened.
            if (hasExtra) {
                SlotDot(solved = practice == null && nightSolved, unlocked = extraUnlocked)
            }

            // No chevron on a locked row: it is the affordance that says
            // "there is more here", and there is not.
            if (onToggle != null) {
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
                if (practice != null) {
                    SlotCard(
                        slot = "Practice Drill",
                        puzzle = practice,
                        unlocked = extraUnlocked,
                        // Never decoded: opening it mints a new one every time.
                        solved = false,
                        lockReason = "Decode the Primer to unlock.",
                        onOpen = onOpen,
                    )
                } else {
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
