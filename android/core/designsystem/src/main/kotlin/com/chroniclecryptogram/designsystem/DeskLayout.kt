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
 * arrive here as widths.
 *
 * Width alone is not the whole story, and assuming it was is what made the game
 * unplayable in landscape: a phone turned sideways is wide *and* short, so the
 * desk also weighs its height before choosing the side rail. See `BoardScreen`.
 *
 * The web equivalent is a single `min-width: 640px` media query, which cannot
 * express "put the tools beside the board" -- so the tools stayed in a fixed
 * bottom dock at every size.
 */
enum class DeskWidth {
    /** Phones, and anything narrow. Tools dock below the board. */
    Compact,

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
            Expanded -> 720.dp
        }

    /** The largest tile the ladder may pick, so a tablet does not get huge type. */
    val maxTileWidth: Dp
        get() = when (this) {
            Compact -> 56.dp
            Expanded -> 64.dp
        }

    companion object {
        /**
         * Material's 600dp breakpoint. Named here so the board does not have to
         * import the window-size-class API, and so a test can hand it a width.
         *
         * There used to be a Medium tier as well, at 840dp. It bought a 640dp
         * board instead of 720dp and a 60dp tile instead of 64dp -- a difference
         * nobody can see, expressed as a third case every `when` had to answer.
         */
        fun fromWidth(width: Dp): DeskWidth = when {
            width < 600.dp -> Compact
            else -> Expanded
        }
    }
}

val LocalDeskWidth = staticCompositionLocalOf { DeskWidth.Compact }

object DeskLayout {
    val width: DeskWidth
        @Composable get() = LocalDeskWidth.current
}

/**
 * The measure a column of prose is set to.
 *
 * Newsprint is unreadable at 1200px wide, which is why the board already caps
 * itself. The list screens did not, so on a phone in landscape the Bureau's
 * cards stretched the full 2424px and "Editions decoded / 1 / 30" became a
 * near-empty band with its two words at opposite ends of the desk.
 *
 * Applied to the scrolling column rather than to each row, so the headings and
 * the cards share one edge instead of drifting apart.
 */
val ReadingMeasure = 760.dp
