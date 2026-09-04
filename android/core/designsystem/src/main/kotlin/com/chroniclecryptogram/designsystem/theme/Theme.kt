package com.chroniclecryptogram.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf

/**
 * Which edition is on the desk. This is a property of the *puzzle*, not a user
 * preference, and it is orthogonal to dark mode: a Night Extra reads on darker
 * stock in both themes, exactly as `.is-night` does on the web.
 */
enum class EditionSlot { Morning, Evening }

val LocalChronicleColors = staticCompositionLocalOf { LightChronicleColors }
val LocalEditionSlot = staticCompositionLocalOf { EditionSlot.Morning }

/**
 * The app's theme. Two independent axes:
 *
 *  - [dark] is the player's preference, mirroring `html.theme-dark`.
 *  - [slot] is the current puzzle's edition, mirroring `.is-night`.
 *
 * Everything the game draws reads [LocalChronicleColors]. The Material scheme
 * below exists only so `ModalBottomSheet`, `Snackbar` and ripples do not arrive
 * in default purple; it is not where the palette lives.
 */
@Composable
fun ChronicleTheme(
    dark: Boolean,
    slot: EditionSlot = EditionSlot.Morning,
    content: @Composable () -> Unit,
) {
    val base = if (dark) DarkChronicleColors else LightChronicleColors
    val colors = if (slot == EditionSlot.Evening) {
        base.copy(paper = base.paperNight, paperDesk = base.paperDeskNight)
    } else {
        base
    }

    CompositionLocalProvider(
        LocalChronicleColors provides colors,
        LocalEditionSlot provides slot,
    ) {
        MaterialTheme(
            colorScheme = colors.toMaterialScheme(dark),
            typography = ChronicleTypography,
            content = content,
        )
    }
}

/** Convenience so call sites read `ChronicleTheme.colors.ink`. */
object ChronicleTheme {
    val colors: ChronicleColors
        @Composable get() = LocalChronicleColors.current

    val slot: EditionSlot
        @Composable get() = LocalEditionSlot.current
}

/**
 * A minimal mapping, not a tonal palette. Only the roles Material's own
 * components actually paint with are filled in; anything else would be inventing
 * colours the design does not have.
 */
private fun ChronicleColors.toMaterialScheme(dark: Boolean) =
    if (dark) {
        darkColorScheme(
            primary = brass,
            onPrimary = paper,
            secondary = selected,
            onSecondary = selectedInk,
            background = paper,
            onBackground = ink,
            surface = paperCard,
            onSurface = ink,
            surfaceVariant = paperMasthead,
            onSurfaceVariant = ink,
            outline = paperRule,
            error = cinnabar,
            onError = paper,
        )
    } else {
        lightColorScheme(
            primary = brass,
            onPrimary = paper,
            secondary = selected,
            onSecondary = selectedInk,
            background = paper,
            onBackground = ink,
            surface = paperCard,
            onSurface = ink,
            surfaceVariant = paperMasthead,
            onSurfaceVariant = ink,
            outline = paperRule,
            error = cinnabar,
            onError = paper,
        )
    }
