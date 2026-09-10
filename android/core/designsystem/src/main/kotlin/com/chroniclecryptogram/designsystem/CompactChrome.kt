package com.chroniclecryptogram.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density

/**
 * Caps how far a subtree's text follows the system font scale.
 *
 * Everything the player *reads* — the quote, the case files, the guide, the
 * coach's advice — scales without limit, because that is the whole point of the
 * setting and the reason this app was rewritten off `rem`.
 *
 * Fixed-width chrome cannot. A five-item section rail divides the screen into
 * five columns whatever the font scale, so at 2.0 its labels ran off the ends:
 * "Archive" became "ARCHIV", "Case File" became "CASE", and "Bureau" fell off
 * the screen. The same happened to the five-tool dock. Ellipsising them would
 * only make the truncation tidier; the labels would still be unreadable, and
 * these are the app's primary navigation.
 *
 * So chrome scales up to [DefaultChromeScale] and then stops. That keeps large type doing
 * real work — these labels are still half again their default size at 2.0 — while
 * the words survive. It is applied only to short labels that sit beside an icon
 * carrying the same meaning, never to content.
 */
@Composable
fun CompactChrome(content: @Composable () -> Unit) {
    val density = LocalDensity.current
    if (density.fontScale <= DefaultChromeScale) {
        content()
        return
    }
    CompositionLocalProvider(
        LocalDensity provides Density(density.density, DefaultChromeScale),
        content = content,
    )
}

/**
 * Chosen by what fits, not by taste: at this scale the longest label in the
 * section rail ("Case File") and the longest in the dock ("CHECK 3") still fit
 * their column on the narrowest supported phone.
 */
const val DefaultChromeScale = 1.3f
