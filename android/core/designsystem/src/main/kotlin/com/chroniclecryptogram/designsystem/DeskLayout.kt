package com.chroniclecryptogram.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * How much room the desk has, and what to do with it.
 *
 * Derived from the window's own width rather than from a device category: a
 * phone in landscape, a tablet, a foldable opened flat and a freeform window all
 * arrive here as widths, and the board only cares about the width.
 *
 * The web equivalent is a single `min-width: 640px` media query, which cannot
 * express "put the tools beside the board" -- so the tools stayed in a fixed
 * bottom dock at every size.
 */
enum class DeskWidth {
    /** Phones, and anything narrow. Tools dock below the board. */
    Compact,

    /** Large phones in landscape and small tablets. Wider tiles, roomier dock. */
    Medium,

    /** Tablets, desktops, unfolded foldables. Tools move beside the board. */
    Expanded;

    /** The tools belong beside the board rather than under it. */
    val usesSideRail: Boolean get() = this == Expanded

    /**
     * A reading measure. Newsprint is unreadable at 1200px wide, so the board is
     * capped and centred rather than stretched -- the same reason
     * `.reading-measure { max-width: 65ch }` exists on the web.
     */
    val boardMaxWidth: Dp
        get() = when (this) {
            Compact -> Dp.Unspecified
            Medium -> 640.dp
            Expanded -> 720.dp
        }

    /** The largest tile the ladder may pick, so a tablet does not get huge type. */
    val maxTileWidth: Dp
        get() = when (this) {
            Compact -> 56.dp
            Medium -> 60.dp
            Expanded -> 64.dp
        }

    companion object {
        /**
         * Material's own breakpoints: 600dp and 840dp. Named here so the board
         * does not have to import the window-size-class API, and so tests can
         * construct a width directly.
         */
        fun fromWidth(width: Dp): DeskWidth = when {
            width < 600.dp -> Compact
            width < 840.dp -> Medium
            else -> Expanded
        }
    }
}

val LocalDeskWidth = staticCompositionLocalOf { DeskWidth.Compact }

object DeskLayout {
    val width: DeskWidth
        @Composable get() = LocalDeskWidth.current
}
