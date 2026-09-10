package com.chroniclecryptogram.designsystem.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * The machine: the typewriter bank, the tool dock and the section rail.
 *
 * Kept out of [ChronicleColors] because that file is generated from the web's
 * `tokens.css` and the web has no equivalent -- its keyboard is a fixed dark
 * bed at every theme, drawn in `board.css`. On a phone that does not hold up.
 * The bank and the dock sit directly under the page, filling the bottom third
 * of the screen, and a near-black slab under cream newsprint reads as a
 * different application rather than as an instrument on a desk.
 *
 * So the machine takes the paper's own temperature in each theme:
 *
 *  - **Day.** A dark umber bed, not black. It still reads as machine against
 *    paper -- it is far darker than anything else on the page -- but it is the
 *    same family of browns, so the desk looks like one object.
 *  - **Night.** Warmed up and lifted off pure black, which is what the old
 *    #0A0908 got wrong: the paper is #1C1A17 and the bank was *darker* than the
 *    page it sat under, so the machine read as a hole rather than as a surface.
 *
 * The keycaps stay dark and brass-rimmed in both. That is the typewriter's
 * identity and the one part that should not follow the paper.
 */
@Immutable
data class InstrumentColors(
    /** The bank the keys are set into. */
    val bed: Color,
    /** The dock and the bank's outer edge, one step darker than [bed]. */
    val edge: Color,
    /** Top and bottom of a keycap's face. */
    val keyTop: Color,
    val keyBottom: Color,
    val keyPressedTop: Color,
    val keyPressedBottom: Color,
    /** The brass rim under a keycap. */
    val keyRim: Color,
    /** A letter on a keycap. */
    val keyInk: Color,
    /** A dock tool that cannot be used right now. */
    val toolDisabled: Color,
)

val LightInstrumentColors = InstrumentColors(
    bed = Color(0xFF3B322A),
    edge = Color(0xFF2A231D),
    keyTop = Color(0xFF554A3E),
    keyBottom = Color(0xFF2E2820),
    keyPressedTop = Color(0xFF332C24),
    keyPressedBottom = Color(0xFF1F1A15),
    keyRim = Color(0xFF8A7340),
    keyInk = Color(0xFFF7F3E8),
    toolDisabled = Color(0xFF8C8172),
)

val DarkInstrumentColors = InstrumentColors(
    // Above the night paper rather than below it: #1C1A17 is the page, so the
    // bed has to be lighter than that to read as something resting on it.
    bed = Color(0xFF322A22),
    edge = Color(0xFF241E19),
    keyTop = Color(0xFF463C31),
    keyBottom = Color(0xFF231D18),
    keyPressedTop = Color(0xFF2A241D),
    keyPressedBottom = Color(0xFF171310),
    keyRim = Color(0xFFC4B48A),
    keyInk = Color(0xFFF7F3E8),
    toolDisabled = Color(0xFF7A7062),
)

val LocalInstrumentColors = staticCompositionLocalOf { LightInstrumentColors }
