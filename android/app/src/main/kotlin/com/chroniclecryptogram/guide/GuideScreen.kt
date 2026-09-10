package com.chroniclecryptogram.guide

import com.chroniclecryptogram.designsystem.PaperList
import com.chroniclecryptogram.designsystem.ChroniclePanel
import com.chroniclecryptogram.designsystem.readingMeasure
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.chroniclecryptogram.designsystem.FolderTabs
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.content.CipherTacticsContent
import com.chroniclecryptogram.content.TacticPoint
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val GuideListTag = "guide-list"

/**
 * The Codebreaker's Handbook: what the tools do, and the five tells worth
 * hunting.
 *
 * Mostly content, not code -- `src/data/cipherTactics.json` is the same file the
 * web reads, so the advice cannot drift between the two surfaces. The desk
 * section is the exception, because the two desks are not the same: see
 * [deskTools].
 */
@Composable
fun GuideScreen(
    tactics: CipherTacticsContent,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors

    // One page per section, the way the web files the handbook. The whole thing
    // as a single scroll was six panels deep and the tactic a player wanted was
    // never the one on screen.
    val pages = remember(tactics) {
        buildList {
            add("Desk" to null)
            // The id, not the title: "Attack the Single-Letter Words First" is
            // a heading, and as a tab it ran off the side of the phone and took
            // every tab after it with it. The web tabs these on the same ids.
            tactics.tactics.forEach { add(tacticTab(it.id) to it) }
        }
    }
    var page by rememberSaveable(tactics.tactics.size) { mutableIntStateOf(0) }
    val current = pages.getOrNull(page) ?: pages.first()

    PaperList(
        title = "The Codebreaker's Handbook",
        testTag = GuideListTag,
        modifier = modifier,
        header = {
            FolderTabs(
                tabs = pages.map { it.first },
                selected = page,
                onSelect = { page = it },
            )
        },
    ) {
        val tactic = current.second
        if (tactic == null) {
            item {
                Text(
                    text = tactics.intro,
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.ink,
                    // The panels below take the measure; this ran the full
                    // width beside them, which on a fold was a 850dp line of
                    // prose over a 760dp card.
                    modifier = Modifier.readingMeasure(),
                )
            }
            item {
                Section(title = "The desk") {
                    deskTools(tactics.tools).forEach { Point(it) }
                }
            }
        } else {
            item(key = tactic.title) {
                Section(title = tactic.title) {
                    Text(
                        text = tactic.summary,
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.brass,
                        modifier = Modifier.padding(bottom = 6.dp),
                    )
                    tactic.points.forEach { Point(it) }
                }
            }
        }
    }
}

/** `short-words` reads as "Short Words" on a tab. */
private fun tacticTab(id: String): String =
    id.split('-').joinToString(" ") { part -> part.replaceFirstChar { it.uppercase() } }

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    val colors = ChronicleTheme.colors
    ChroniclePanel(contentPadding = PaddingValues(12.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = colors.ink,
            modifier = Modifier
                .padding(bottom = 6.dp)
                .semantics { heading() },
        )
        content()
    }
}

/**
 * The tools this desk actually has.
 *
 * The shared file describes the web's desk, and the two have diverged:
 *
 *  - **Zoom is gone here.** Tiles are measured from `sp` text, so the system
 *    font-size setting *is* the zoom control and there are no A-/A+ buttons to
 *    document. Leaving them listed told players to look for controls that do
 *    not exist.
 *  - **Undo is missing from the file.** The dock has it, so it is added here.
 *    The web dock has one too, which makes the omission a gap in the shared
 *    file rather than a difference between the apps -- worth fixing there.
 */
private fun deskTools(shared: List<TacticPoint>): List<TacticPoint> {
    val withoutZoom = shared.filterNot { it.lead in ZoomLeads }
    val undo = TacticPoint(
        lead = "Undo",
        body = "Take back the last letter you typed. Hints and checks already " +
            "spent are not refunded.",
    )
    // Placed where it sits on the dock: after Hint, before the tally.
    val at = withoutZoom.indexOfFirst { it.lead == "Glyph Tally" }
    return if (at >= 0) {
        withoutZoom.toMutableList().apply { add(at, undo) }
    } else {
        withoutZoom + undo
    }
}

/** The two entries that describe controls this build does not have. */
private val ZoomLeads = setOf("Smaller Type", "Larger Type")

@Composable
private fun Point(point: TacticPoint) {
    val colors = ChronicleTheme.colors
    Column(
        Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .semantics { contentDescription = "${point.lead}. ${point.body}" },
    ) {
        Text(
            text = point.lead,
            style = MaterialTheme.typography.labelLarge,
            color = colors.brass,
        )
        Text(
            text = point.body,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.ink,
        )
    }
}
