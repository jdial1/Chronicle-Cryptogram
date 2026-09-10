package com.chroniclecryptogram.casefile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import com.chroniclecryptogram.designsystem.PaperList
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.runtime.Composable
import com.chroniclecryptogram.designsystem.FolderTabs
import com.chroniclecryptogram.designsystem.ChroniclePanel
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.content.CaseFileContent
import com.chroniclecryptogram.content.CaseFiles
import com.chroniclecryptogram.content.CaseNoteSegment
import com.chroniclecryptogram.designsystem.PressInk
import com.chroniclecryptogram.designsystem.Woodcuts
import com.chroniclecryptogram.designsystem.theme.ChronicleFonts
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val CaseFileListTag = "case-file-list"

/**
 * The dossiers, assembled from what the player has decoded.
 *
 * Nothing here reveals an unsolved edition: [CaseFiles.assemble] withholds any
 * fragment with no decoded quote, so this screen is a record of the player's own
 * work rather than a table of contents for the story.
 */
@Composable
fun CaseFileScreen(
    content: CaseFileContent,
    puzzles: List<PuzzleData>,
    solvedPuzzleIds: Set<String>,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    var expanded by remember { mutableStateOf<String?>(null) }

    // Only people the player has actually turned up something on. A dossier
    // with no notes in it is not a teaser, it is an empty folder: it lists the
    // cast before they have appeared and spoils who the story is about.
    val dossiers = remember(content, puzzles, solvedPuzzleIds) {
        content.characters
            .map { character ->
                character to CaseFiles.unlockedFragmentsForCharacter(
                    character.id, content, puzzles, solvedPuzzleIds,
                )
            }
            .filter { (_, fragments) -> fragments.isNotEmpty() }
    }

    if (dossiers.isEmpty()) {
        // Not an empty tab strip over an empty page: before the first edition
        // is decoded there is no cast to file, and saying so is the whole
        // content of this screen.
        PaperList(title = "Case File", testTag = CaseFileListTag, modifier = modifier) {
            item {
                Text(
                    text = "Nothing on file yet. Decode an edition and whoever it " +
                        "names opens a dossier here.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.paperRule,
                    modifier = Modifier.semantics {
                        contentDescription = "No dossiers yet. Decode an edition to open one."
                    },
                )
            }
        }
        return
    }

    // One dossier per tab, the way the web files them. Clamped rather than
    // remembered by id: a tab can disappear between compositions only by the
    // player losing progress, and landing on the first is the right answer then.
    var open by rememberSaveable(dossiers.size) { mutableIntStateOf(0) }
    val (character, fragments) = dossiers[open.coerceIn(dossiers.indices)]

    PaperList(
        title = "Case File",
        testTag = CaseFileListTag,
        modifier = modifier,
        header = {
            FolderTabs(
                tabs = dossiers.map { dossierTab(it.first.name) },
                selected = open.coerceIn(dossiers.indices),
                onSelect = { open = it },
            )
        },
    ) {
        item(key = "${character.id}-head") {
            Column(
                Modifier
                    .fillMaxWidth()
                    .semantics {
                        contentDescription =
                            "${character.name}, ${fragments.size} notes decoded"
                    },
            ) {
                Text(
                    text = character.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.ink,
                )
                Text(
                    text = character.dossier,
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.brass,
                )
            }
        }

        items(fragments, key = { "${character.id}-${it.title}" }) { fragment ->
            ChroniclePanel(contentPadding = PaddingValues(12.dp)) {
                Text(
                    text = fragment.title,
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.ink,
                )
                Text(
                    text = buildNote(fragment.segments),
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.ink,
                )
            }
        }
    }
}


/**
 * Renders a dossier note. Decoded quotes are set in the typewriter face and
 * italicised, so the player's own solved text reads as evidence rather than as
 * more of the narrator's prose.
 */
/**
 * The name a tab carries.
 *
 * The honorific goes first, the way the web's `dossierSubject` drops it, or
 * three of seven dossiers would file under "DETECTIVE" and "DR". What is left is
 * the given name, which is distinct across the whole cast -- three of them are
 * Vances, so a surname would not be.
 */
internal fun dossierTab(name: String): String = name
    .removePrefix("Detective ")
    .removePrefix("Dr. ")
    .trim()
    .substringBefore(' ')

@Composable
private fun buildNote(segments: List<CaseNoteSegment>) = buildAnnotatedString {
    for (segment in segments) {
        when (segment.kind) {
            CaseNoteSegment.Kind.TEXT -> append(segment.value)
            CaseNoteSegment.Kind.QUOTE -> withStyle(
                SpanStyle(
                    fontFamily = ChronicleFonts.Typewriter,
                    fontStyle = FontStyle.Italic,
                )
            ) {
                append(segment.value)
            }
        }
    }
}

/** A press plate, tinted with its authored ink. */
@Composable
fun WoodcutPlate(name: String, modifier: Modifier = Modifier) {
    val plate = Woodcuts[name] ?: return
    val colors = ChronicleTheme.colors
    Icon(
        painter = painterResource(plate.drawableRes),
        contentDescription = null,
        tint = when (plate.ink) {
            PressInk.LAMPBLACK -> colors.inkLampblack
            PressInk.CINNABAR -> colors.inkCinnabar
            PressInk.PRUSSIAN -> colors.inkPrussian
            PressInk.SEPIA -> colors.inkSepia
        },
        modifier = modifier.size(48.dp),
    )
}
