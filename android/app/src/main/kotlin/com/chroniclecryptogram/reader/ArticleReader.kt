package com.chroniclecryptogram.reader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.casefile.WoodcutPlate
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleFonts
import com.chroniclecryptogram.designsystem.readingMeasure
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/** Prose takes a narrower measure than a page of cards. */
private val ArticleMeasure = 640.dp

/**
 * The story behind an edition: plate, headline, dek, byline, and -- once the
 * cipher is broken -- the decoded dispatch as printed copy.
 *
 * Open from the board at any time, the way the web's Story button is. The dek
 * and the byline are the hook that makes a player want to solve it, so holding
 * them back until afterwards gets the incentive backwards. The dispatch itself
 * is the answer, so [solved] is what gates that one paragraph rather than the
 * whole page.
 *
 * The web wrapped this in its own A-/A+ zoom control. That does not come across:
 * text is in sp, so the system font-size setting scales it, which is the control
 * Android users already know.
 */
@Composable
fun ArticleReader(
    puzzle: PuzzleData,
    /** Whether the cipher has been broken. The dispatch is the answer. */
    solved: Boolean,
    /** Returns to the board. Back does the same thing. */
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val night = Edition.isNightEdition(puzzle)

    Column(
        modifier
            .fillMaxSize()
            .background(if (night) colors.paperNight else colors.paper)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        // A ruled slug, matching the STORY control it was opened from.
        Row(
            Modifier
                .border(1.dp, colors.ink, RoundedCornerShape(2.dp))
                .clickable(onClick = onClose)
                .heightIn(min = 40.dp)
                .padding(horizontal = 10.dp)
                .semantics { contentDescription = "Back to the desk" },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "← BACK TO THE DESK",
                style = MaterialTheme.typography.labelLarge,
                color = colors.ink,
                maxLines = 1,
            )
        }

        puzzle.silhouette?.let {
            WoodcutPlate(it, Modifier.align(Alignment.CenterHorizontally))
        }

        Text(
            text = puzzle.headline,
            style = MaterialTheme.typography.displayLarge,
            color = colors.ink,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .semantics { heading() },
        )

        Text(
            text = Edition.articleDek(puzzle),
            style = MaterialTheme.typography.titleMedium,
            color = colors.ink,
            modifier = Modifier
                // 640 rather than the list pages' 760: this is unbroken
                // newsprint, and prose takes a narrower measure than a column
                // of cards does.
                .readingMeasure(ArticleMeasure)
                .align(Alignment.CenterHorizontally),
        )

        Text(
            text = Edition.articleByline(puzzle),
            style = MaterialTheme.typography.labelLarge,
            color = colors.brass,
            modifier = Modifier.semantics {
                contentDescription = "Filed by ${Edition.articleByline(puzzle)}"
            },
        )

        if (solved) {
            Text(
                text = puzzle.originalText,
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontFamily = ChronicleFonts.Letterpress,
                ),
                color = colors.ink,
                modifier = Modifier
                    .readingMeasure(ArticleMeasure)
                    .align(Alignment.CenterHorizontally)
                    .semantics { contentDescription = "Decoded dispatch" },
            )
        } else {
            Text(
                // Says why it is missing rather than leaving a gap where the
                // copy should be, which reads as content that failed to load.
                text = "The dispatch itself is still in cipher. Break it on the " +
                    "desk and it prints here.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.paperRule,
                modifier = Modifier
                    .readingMeasure(ArticleMeasure)
                    .align(Alignment.CenterHorizontally)
                    .semantics { contentDescription = "The dispatch is still in cipher" },
            )
        }
    }
}
