package com.chroniclecryptogram.guide

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
 * All of it is content, not code -- `src/data/cipherTactics.json` is the same
 * file the web reads, so the advice cannot drift between the two surfaces.
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
                tactics.tools.forEach { Point(it) }
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
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .background(colors.paperCard)
            .padding(12.dp),
    ) {
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
