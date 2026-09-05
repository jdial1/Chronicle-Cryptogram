package com.chroniclecryptogram.board

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chroniclecryptogram.designsystem.CompactChrome
import com.chroniclecryptogram.designsystem.theme.BoardTextStyles
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val DockTag = "desk-dock"
const val TallySheetTag = "tally-sheet"

/** What a tool does, so the dock and the side rail can share one list. */
internal data class DeskTool(
    val label: String,
    val icon: ImageVector,
    /** Shown beside the label when the tool spends a wallet. */
    val count: Int?,
    val description: String,
    val enabled: Boolean,
    val onClick: () -> Unit,
)

internal fun deskTools(
    state: BoardState,
    onHint: () -> Unit,
    onCheck: () -> Unit,
    onUndo: () -> Unit,
    onTally: () -> Unit,
    onClear: () -> Unit,
): List<DeskTool> = listOf(
    DeskTool(
        label = "Check",
        icon = Icons.Filled.Check,
        count = state.checksRemaining,
        description = "Test the selected guess. ${state.checksRemaining} checks left this edition.",
        enabled = state.checksRemaining > 0 && state.selectedSymbolId != null,
        onClick = onCheck,
    ),
    DeskTool(
        label = "Hint",
        icon = Icons.Filled.Search,
        count = state.hintsRemaining,
        description = "Reveal the selected glyph. ${state.hintsRemaining} hints left this edition.",
        enabled = state.hintsRemaining > 0 && state.selectedSymbolId != null,
        onClick = onHint,
    ),
    DeskTool(
        label = "Undo",
        icon = Icons.AutoMirrored.Filled.ArrowBack,
        count = null,
        description = "Take back the last letter you typed.",
        enabled = state.canUndo,
        onClick = onUndo,
    ),
    DeskTool(
        label = "Tally",
        icon = Icons.AutoMirrored.Filled.List,
        count = null,
        description = "Show how often each glyph appears in this quote.",
        enabled = true,
        onClick = onTally,
    ),
    DeskTool(
        label = "Wipe",
        icon = Icons.Filled.Refresh,
        count = null,
        description = "Wipe every guess and start the quote over.",
        enabled = state.mappings.keys.any { it !in state.lockedSymbolIds },
        onClick = onClear,
    ),
)

/**
 * The five desk tools, on the dark bar under the keyboard.
 *
 * Dark rather than paper because the dock belongs to the typewriter, not to the
 * page. That is the separation the web build draws, and it keeps the eye on the
 * cipher above rather than on the controls.
 */
@Composable
internal fun DeskDock(tools: List<DeskTool>, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(BankEdge)
            .padding(horizontal = 4.dp, vertical = 6.dp)
            .testTag(DockTag),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Five fixed columns, so the labels are capped for the same reason the
        // section rail's are: at 2.0 "CHECK 3" lost its count off the edge.
        CompactChrome {
            tools.forEach { tool -> DockTool(tool, Modifier.weight(1f)) }
        }
    }
}

/** The same five tools, stacked for a window wide enough for a side rail. */
@Composable
internal fun DeskRail(tools: List<DeskTool>, modifier: Modifier = Modifier) {
    Column(
        modifier
            .background(BankEdge)
            .padding(vertical = 6.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        CompactChrome {
            tools.forEach { tool -> DockTool(tool) }
        }
    }
}

@Composable
private fun DockTool(tool: DeskTool, modifier: Modifier = Modifier) {
    val colors = ChronicleTheme.colors
    // Brass on the dark bar, dimmed rather than hidden when spent: a spent
    // wallet still has to show its count, which is the point of the badge.
    val tint = if (tool.enabled) colors.brass else Color(0xFF6B6156)

    Column(
        modifier
            .clip(RoundedCornerShape(4.dp))
            .clickable(enabled = tool.enabled, onClick = tool.onClick)
            // 48dp is the accessible minimum; icon and label together clear it.
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .padding(vertical = 4.dp)
            // One stop per tool: the label and its count are the same thing.
            .semantics(mergeDescendants = true) {
                contentDescription = tool.description
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(tool.icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            // The count is part of the label, not a separate thing to drop.
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                text = tool.label.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = tint,
                fontSize = 10.sp,
                letterSpacing = 0.8.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
            tool.count?.let { count ->
                Text(
                    text = " $count",
                    color = if (count > 0) colors.cinnabar else tint,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                )
            }
        }
    }
}

/**
 * Glyph frequencies for this quote.
 *
 * Frequency analysis is the technique the game actually teaches, so the counts
 * are a tool rather than a hint: they cost nothing and reveal no letters.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun TallySheet(
    state: BoardState,
    onSelectSymbol: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val colors = ChronicleTheme.colors
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = colors.paperCard,
        // Square at the top, like a sheet pulled from a drawer.
        shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp),
        dragHandle = null,
    ) {
        Column(
            Modifier
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp)
                .testTag(TallySheetTag)
        ) {
            Text(
                text = "Glyph tally",
                style = MaterialTheme.typography.titleMedium,
                color = colors.ink,
            )
            Text(
                text = "Busiest first. English leans on E, T, A, O, I, N.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.paperRule,
                modifier = Modifier.padding(bottom = 12.dp),
            )

            if (state.tally.isEmpty()) {
                Text(
                    text = "No glyph repeats in this quote, so there is nothing to count.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.paperRule,
                )
                return@Column
            }

            val hottest = state.tally.first().count
            LazyVerticalGrid(columns = GridCells.Adaptive(56.dp)) {
                items(state.tally.size) { index ->
                    val item = state.tally[index]
                    TallyCell(
                        item = item,
                        hottest = item.count == hottest,
                        selected = item.symbolId == state.selectedSymbolId,
                        onClick = {
                            onSelectSymbol(item.symbolId)
                            onDismiss()
                        },
                    )
                }
            }
        }
    }
}

/**
 * One glyph, its count, and the letter it currently carries.
 *
 * Tapping it moves the cursor to that glyph, which is what makes the tally a
 * working tool rather than a read-only chart: you spot the busiest mark, then
 * type into it without hunting for it on the board.
 */
@Composable
private fun TallyCell(
    item: GlyphCount,
    hottest: Boolean,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = ChronicleTheme.colors
    Column(
        Modifier
            .padding(3.dp)
            .clip(RoundedCornerShape(3.dp))
            .background(if (selected) colors.selected else colors.paper)
            .border(
                width = if (selected || hottest) 2.dp else 1.dp,
                color = when {
                    selected -> colors.ink
                    hottest -> colors.brass
                    else -> colors.paperRule
                },
                shape = RoundedCornerShape(3.dp),
            )
            .clickable(onClick = onClick)
            .sizeIn(minHeight = 48.dp)
            .padding(vertical = 4.dp)
            .semantics {
                contentDescription = buildString {
                    append("Glyph ")
                    append(item.glyph)
                    append(", ")
                    append(item.count)
                    append(if (item.count == 1) " time" else " times")
                    append(item.mappedLetter?.let { ", mapped to $it" } ?: ", unmapped")
                }
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // The bundled cipher face, not the body face. The 54 glyphs span
        // Latin Extended, UCAS, Lisu and APL; a text face has none of them and
        // renders a tofu box, which is the whole reason that font is bundled.
        Text(
            text = item.glyph,
            style = BoardTextStyles.tileGlyph.copy(fontSize = 18.sp),
            color = colors.ink,
        )
        Text(
            text = "${item.count}",
            color = colors.ink,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
        )
        // Always occupies its line, so the grid does not jog as letters land.
        Text(
            text = item.mappedLetter ?: " ",
            color = colors.brass,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
