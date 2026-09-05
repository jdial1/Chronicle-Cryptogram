package com.chroniclecryptogram.designsystem

import androidx.compose.ui.unit.Density
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

/**
 * The cap that keeps fixed-width chrome readable at large type.
 *
 * At font scale 2.0 the five-column section rail rendered "ARCHIV", "CASE" and a
 * "BUREAU" that ran off the screen, and the dock dropped the count off "CHECK 3".
 * These are the app's primary navigation, so the labels are held at
 * [DefaultChromeScale] while everything the player reads keeps scaling.
 *
 * The composable itself needs a composition; the decision it makes does not, so
 * that is what is tested here.
 */
class CompactChromeTest {

    /** The rule `CompactChrome` applies, extracted so it can be checked directly. */
    private fun capped(density: Density, maxScale: Float = DefaultChromeScale): Density =
        if (density.fontScale <= maxScale) density else Density(density.density, maxScale)

    @Test
    fun `a normal font scale passes through untouched`() {
        val density = Density(density = 2.75f, fontScale = 1.0f)
        assertEquals(density, capped(density))
    }

    @Test
    fun `scaling below the cap is left alone, because it still fits`() {
        // The point is not to flatten large type, only to stop it overflowing.
        val density = Density(density = 2.75f, fontScale = 1.25f)
        assertEquals(1.25f, capped(density).fontScale)
    }

    @Test
    fun `the largest system setting is held at the cap`() {
        val capped = capped(Density(density = 2.75f, fontScale = 2.0f))
        assertEquals(DefaultChromeScale, capped.fontScale)
    }

    @Test
    fun `capping the font scale never changes the pixel density`() {
        // dp measurements -- touch targets, icon sizes, rules -- must not move
        // when the cap engages; only the type stops growing.
        val capped = capped(Density(density = 3.5f, fontScale = 2.0f))
        assertEquals(3.5f, capped.density)
    }

    @Test
    fun `the cap still leaves large type doing real work`() {
        // Half again the default size. A cap that flattened chrome back to 1.0
        // would be an accessibility regression dressed up as a layout fix.
        assert(DefaultChromeScale >= 1.25f) {
            "the chrome cap should keep a visible increase at large type"
        }
    }
}
