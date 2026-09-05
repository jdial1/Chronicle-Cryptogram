package com.chroniclecryptogram.guide

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import com.chroniclecryptogram.designsystem.ChroniclePanel
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.widthIn
import com.chroniclecryptogram.designsystem.ReadingMeasure
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .testTag(GuideListTag),
        contentPadding = PaddingValues(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                text = "The Codebreaker's Handbook",
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
                modifier = Modifier.semantics { heading() },
            )
        }
        item {
            Text(
                text = tactics.intro,
                style = MaterialTheme.typography.bodyLarge,
                color = colors.ink,
            )
        }

        item {
            Section(title = "The desk") {
                deskTools(tactics.tools).forEach { Point(it) }
            }
        }

        items(tactics.tactics.size) { index ->
            val tactic = tactics.tactics[index]
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
