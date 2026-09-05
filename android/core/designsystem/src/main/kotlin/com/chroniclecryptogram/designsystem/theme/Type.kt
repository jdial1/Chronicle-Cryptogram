package com.chroniclecryptogram.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.chroniclecryptogram.designsystem.R

/**
 * The paper's voice. These mirror the semantic utility classes in
 * `src/styles/tokens.css` one for one, so a component ported from the web asks
 * for the same face by the same name.
 *
 * Every face is bundled rather than fetched with Downloadable Fonts: this is a
 * paid, offline-first game, and `core-googlefonts` needs Play Services plus a
 * network round trip before first paint.
 *
 * The TTFs are converted from the woff2 files the web already serves
 * (scripts/gen-fonts.mjs), so both surfaces render from identical outlines.
 *
 * Only the faces the app actually draws with are bundled. The web also defines
 * Beth Ellen, UnifrakturMaguntia and Cinzel; nothing on Android sets type in
 * them, and a face named here cannot be stripped by resource shrinking, so
 * carrying them cost ~195KB of every APK for nothing. Add a family back when
 * something draws with it, not before.
 */
object ChronicleFonts {

    val Masthead = FontFamily(
        Font(R.font.playfair_display_700, FontWeight.Bold),
        Font(R.font.playfair_display_900, FontWeight.Black),
    )

    val Newspaper = FontFamily(
        Font(R.font.newsreader_400),
        Font(R.font.newsreader_400_italic, style = FontStyle.Italic),
        Font(R.font.newsreader_700, FontWeight.Bold),
    )

    val Letterpress = FontFamily(Font(R.font.im_fell_english_400))

    val Typewriter = FontFamily(Font(R.font.special_elite_400))

    /**
     * The 54 cipher glyphs, and nothing else.
     *
     * This must be used for every glyph the player decodes. Measured against the
     * eleven display faces above, **25 of the 54 codepoints are covered by none
     * of them** -- they span Number Forms, Canadian Aboriginal, Lisu, Hangul, APL
     * and Geometric Shapes. Falling through to the device's own Noto chain makes
     * rendering depend on OEM, Android version and whether the device ships CJK,
     * and a missing glyph is tofu on the board.
     *
     * scripts/gen-glyph-font.mjs builds this from OFL Noto sources; the result is
     * about 5 KB and identical on every device.
     */
    val CipherGlyph = FontFamily(Font(R.font.chronicle_glyphs))
}

/**
 * Sizes are in **sp**, deliberately, so Android's font-scale setting works. The
 * board derives its tile boxes from measured text rather than fixed heights, so
 * larger type makes larger tiles instead of clipping -- which is exactly what the
 * `rem`-based CSS could not do.
 */
val ChronicleTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = ChronicleFonts.Masthead,
        fontWeight = FontWeight.Black,
        fontSize = 40.sp,
        lineHeight = 44.sp,
    ),
    displayMedium = TextStyle(
        fontFamily = ChronicleFonts.Masthead,
        fontWeight = FontWeight.Bold,
        fontSize = 30.sp,
        lineHeight = 34.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = ChronicleFonts.Letterpress,
        fontSize = 24.sp,
        lineHeight = 30.sp,
    ),
    // What Material3 titles an AlertDialog with. It had no entry here, so every
    // dialog in a printed newspaper announced itself in Roboto -- visible in one
    // place only once the three hand-rolled dialogs became ChronicleDialog.
    headlineSmall = TextStyle(
        fontFamily = ChronicleFonts.Letterpress,
        fontSize = 20.sp,
        lineHeight = 26.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = ChronicleFonts.Newspaper,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = ChronicleFonts.Newspaper,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = ChronicleFonts.Newspaper,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = ChronicleFonts.Typewriter,
        fontSize = 14.sp,
        lineHeight = 18.sp,
    ),
)

/** The two faces the cipher board itself uses. */
object BoardTextStyles {
    val tileLetter = TextStyle(fontFamily = ChronicleFonts.Typewriter, fontSize = 20.sp)
    val tileGlyph = TextStyle(fontFamily = ChronicleFonts.CipherGlyph, fontSize = 18.sp)
    val tilePunctuation = TextStyle(fontFamily = ChronicleFonts.Newspaper, fontSize = 24.sp)
}
