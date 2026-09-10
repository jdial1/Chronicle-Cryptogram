package com.chroniclecryptogram.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * A page of the paper: the app's one repeating full-screen list.
 *
 * The Archive, the Case File, the Handbook and the Bureau File are the same
 * layout -- ground, insets, gutter, a title, then cards -- and each had written
 * it out itself. The four copies had already drifted in exactly the way
 * [ChroniclePanel]'s own history describes: the Archive had no spacing between
 * items where the others had twelve, and the four titles carried four different
 * modifiers, only one of which capped the heading to the reading measure. On a
 * landscape phone that left three of the four running a display face the whole
 * width of the desk.
 *
 * The heading is part of the scaffold rather than the caller's first item
 * because that is the part that drifted, and because every one of these screens
 * has to say what it is: two of them used to drop the reader straight into
 * cards.
 */
@Composable
fun PaperList(
    title: String,
    testTag: String,
    modifier: Modifier = Modifier,
    /** The Archive is a long list of rows and wants less air than a page of cards. */
    verticalArrangement: Arrangement.Vertical = Arrangement.spacedBy(12.dp),
    /**
     * Pinned under the title, above the scrolling content. Tabs live here: a
     * tab strip that scrolls away is one the reader has to scroll back up to
     * before they can change section.
     */
    header: (@Composable () -> Unit)? = null,
    content: LazyListScope.() -> Unit,
) {
    Column(
        Modifier
            .fillMaxSize()
            .background(ChronicleTheme.colors.paper)
            .safeDrawingPadding()
            .then(modifier),
        // The list centres its cards; without this the pinned title sat hard
        // against the left edge while the content it names was centred, and on
        // a tablet the two were three hundred dp apart.
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.displayMedium,
            color = ChronicleTheme.colors.ink,
            modifier = Modifier
                .readingMeasure()
                .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 8.dp)
                .semantics { heading() },
        )

        header?.invoke()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .testTag(testTag),
            contentPadding = PaddingValues(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = verticalArrangement,
            content = content,
        )
    }
}
