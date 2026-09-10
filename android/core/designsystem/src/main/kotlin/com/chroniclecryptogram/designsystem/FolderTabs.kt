package com.chroniclecryptogram.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * A row of manila folder tabs, the way the web's case files and handbook are
 * filed.
 *
 * Card stock for the open tab, board for the closed ones, and an ink rule under
 * the whole row that the open tab sits on rather than behind -- which is the
 * detail that makes it read as a folder rather than as a segmented control.
 *
 * Scrolls horizontally because the case file grows a tab per character and a
 * phone cannot show eight at once. Tabs keep their own width instead of
 * dividing the row, so they do not shrink to illegibility as the cast grows.
 */
@Composable
fun FolderTabs(
    tabs: List<String>,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors

    Column(modifier.fillMaxWidth()) {
        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            tabs.forEachIndexed { index, label ->
                val open = index == selected
                val shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                Text(
                    text = label.uppercase(),
                    style = MaterialTheme.typography.labelLarge,
                    // Weight as well as colour: the open tab has to be tellable
                    // apart without relying on the fill alone.
                    fontWeight = if (open) FontWeight.Black else FontWeight.Normal,
                    color = if (open) colors.ink else colors.brass,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier
                        .widthIn(min = 88.dp)
                        .clip(shape)
                        .background(if (open) colors.paperCard else colors.paperMasthead)
                        .border(1.dp, if (open) colors.ink else colors.paperRule, shape)
                        .selectable(
                            selected = open,
                            role = Role.Tab,
                            onClick = { onSelect(index) },
                        )
                        .heightIn(min = 44.dp)
                        .padding(horizontal = 10.dp, vertical = 12.dp),
                )
            }
        }
        HorizontalDivider(thickness = 2.dp, color = colors.ink)
    }
}
