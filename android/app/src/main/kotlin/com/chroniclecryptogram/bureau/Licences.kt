package com.chroniclecryptogram.bureau

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.R as DesignR

/**
 * One bundled typeface and the terms it travels under.
 *
 * Every string here was read out of the font's own `name` table rather than
 * looked up, because that table is what the licence actually attaches to -- and
 * doing it that way turned up the thing a lookup would have missed: Special
 * Elite is Apache 2.0, not OFL like the rest.
 */
private data class FontNotice(
    val family: String,
    val copyright: String,
    val licence: Licence,
)

private enum class Licence(val label: String, val resource: Int) {
    Ofl("SIL Open Font License 1.1", DesignR.raw.license_ofl),
    Apache("Apache License 2.0", DesignR.raw.license_apache),
}

/**
 * The credits, and the reason they are not optional.
 *
 * Both licences here require their text to travel with the software, and eight
 * TTFs ship inside the APK. There was no credits screen at all until 1.0, which
 * made a paid release a licence breach on every install -- the cheapest kind of
 * problem to fix and the most embarrassing kind to be told about.
 *
 * Chronicle Glyphs is the cipher face and is ours only in the sense that a
 * script assembled it: `scripts/gen-glyph-font.mjs` subsets eight Noto families
 * down to the 54 glyphs the puzzles use and merges them. It carries their
 * licence, so they are named individually.
 */
private val Notices = listOf(
    FontNotice(
        "IM Fell English",
        "© 2007 Igino Marini (www.iginomarini.com), with Reserved Font Name " +
            "IM FELL English Roman",
        Licence.Ofl,
    ),
    FontNotice(
        "Newsreader",
        "Copyright 2020 The Newsreader Project Authors " +
            "(github.com/productiontype/Newsreader)",
        Licence.Ofl,
    ),
    FontNotice(
        "Playfair Display",
        "Copyright 2017 The Playfair Display Project Authors " +
            "(github.com/clauseggers/Playfair-Display), with Reserved Font Name " +
            "\"Playfair Display\"",
        Licence.Ofl,
    ),
    FontNotice(
        "Special Elite",
        "Copyright © 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI)",
        Licence.Apache,
    ),
    FontNotice(
        "Chronicle Glyphs",
        "Subset and merged from Noto Sans, Noto Serif, Noto Sans KR, Noto Sans " +
            "Lisu, Noto Sans Canadian Aboriginal, Noto Sans Math, Noto Sans " +
            "Symbols and Noto Sans Symbols 2. Copyright 2022 The Noto Project " +
            "Authors and Google LLC.",
        Licence.Ofl,
    ),
)

/** The Bureau's credits section. Renders inside the caller's panel. */
@Composable
fun LicencesSection() {
    val colors = ChronicleTheme.colors
    var reading by remember { mutableStateOf<Licence?>(null) }

    reading?.let { licence ->
        LicenceDialog(licence) { reading = null }
    }

    Text(
        // Worth saying in the app and not only on the listing: it is the
        // question a paid offline game is most often asked, and the honest
        // answer is short.
        text = "This edition keeps everything on your device. It has no account, " +
            "no network permission and nothing to send.",
        style = MaterialTheme.typography.bodyMedium,
        color = colors.ink,
    )

    Notices.forEach { notice ->
        Column(Modifier.padding(top = 10.dp)) {
            Text(
                text = notice.family,
                style = MaterialTheme.typography.labelLarge,
                color = colors.brass,
            )
            Text(
                text = notice.copyright,
                style = MaterialTheme.typography.bodySmall,
                color = colors.paperRule,
            )
            TextButton(
                onClick = { reading = notice.licence },
                modifier = Modifier
                    .heightIn(min = 48.dp)
                    // Four of these read "SIL Open Font License 1.1" and nothing
                    // else, which leaves a screen reader with four identical
                    // buttons and no way to say which font each belongs to. The
                    // description carries the family; the cap stays short.
                    .semantics {
                        contentDescription = "${notice.licence.label}, ${notice.family}"
                    },
            ) {
                Text(notice.licence.label, color = colors.ink)
            }
        }
    }
}

@Composable
private fun LicenceDialog(licence: Licence, onDismiss: () -> Unit) {
    val colors = ChronicleTheme.colors
    val context = LocalContext.current
    // Read once per opening. Four kilobytes of OFL and eleven of Apache: small
    // enough to hold, large enough not to want in the binary as a string
    // constant, and never touched unless someone opens the dialog.
    val text = remember(licence) {
        context.resources.openRawResource(licence.resource)
            .bufferedReader()
            .use { it.readText() }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.paperCard,
        titleContentColor = colors.ink,
        textContentColor = colors.ink,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.border(2.dp, colors.ink, RoundedCornerShape(4.dp)),
        title = { Text(licence.label, color = colors.ink) },
        text = {
            Text(
                text = text,
                // Monospace and small: both texts are laid out in fixed columns
                // and reflowing them into the body face makes the section
                // headings unreadable.
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                lineHeight = 14.sp,
                color = colors.ink,
                modifier = Modifier.verticalScroll(rememberScrollState()),
            )
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close", color = colors.ink) }
        },
    )
}
