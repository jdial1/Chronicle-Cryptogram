package com.chroniclecryptogram.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * A card of paper: the app's one repeating container.
 *
 * The same recipe -- clip to a small radius, fill with card stock, sometimes a
 * rule around it, pad the inside -- was written out by hand in eight files, with
 * two of them keeping a private `Card` or `Section` of their own. That is how
 * the corner radius came to differ between screens and how the reading measure
 * was applied to some rows and not others.
 *
 * The measure is on by default because every caller wanted it: a card that fills
 * a landscape phone puts a label at one end of the desk and its value at the
 * other. Pass `Dp.Unspecified` for the few places that genuinely span.
 */
@Composable
fun ChroniclePanel(
    modifier: Modifier = Modifier,
    background: Color = ChronicleTheme.colors.paperCard,
    /** Null for no rule, which is the common case. */
    border: Color? = null,
    corner: Dp = 6.dp,
    maxWidth: Dp = ReadingMeasure,
    contentPadding: PaddingValues = PaddingValues(16.dp),
    verticalArrangement: Arrangement.Vertical = Arrangement.spacedBy(6.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(corner)
    Column(
        modifier
            // Capped before it fills. The other order fixes the width first and
            // leaves the cap nothing to constrain -- a mistake this codebase has
            // made twice.
            .then(if (maxWidth != Dp.Unspecified) Modifier.widthIn(max = maxWidth) else Modifier)
            .fillMaxWidth()
            .clip(shape)
            .background(background)
            .then(if (border != null) Modifier.border(1.dp, border, shape) else Modifier)
            .padding(contentPadding),
        verticalArrangement = verticalArrangement,
        content = content,
    )
}
