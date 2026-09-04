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
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * The clipping behind a solved edition: headline, dek, byline and the decoded
 * quote as printed copy.
 *
 * Only reachable once the edition is solved -- the quote *is* the answer, so
 * opening it early would hand the player the puzzle.
 *
 * The web wrapped this in its own A-/A+ zoom control. That does not come across:
 * text is in sp, so the system font-size setting scales it, which is the control
 * Android users already know.
 */
@Composable
fun ArticleReader(
    puzzle: PuzzleData,
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
                .fillMaxWidth()
                // A reading measure. Long lines of newsprint are unreadable.
                .widthIn(max = 640.dp)
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

        Text(
            text = puzzle.originalText,
            style = MaterialTheme.typography.bodyLarge.copy(
                fontFamily = ChronicleFonts.Letterpress,
            ),
            color = colors.ink,
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 640.dp)
                .align(Alignment.CenterHorizontally)
                .semantics { contentDescription = "Decoded dispatch" },
        )
    }
}
