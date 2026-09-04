package com.chroniclecryptogram.casefile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
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

    val dossiers = remember(content, puzzles, solvedPuzzleIds) {
        content.characters.map { character ->
            character to CaseFiles.unlockedFragmentsForCharacter(
                character.id, content, puzzles, solvedPuzzleIds,
            )
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .testTag(CaseFileListTag),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                text = "Case File",
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
                modifier = Modifier
                    .padding(bottom = 4.dp)
                    .semantics { heading() },
            )
        }

        items(dossiers, key = { it.first.id }) { (character, fragments) ->
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(6.dp))
                    .background(colors.paperCard)
                    .clickable {
                        expanded = if (expanded == character.id) null else character.id
                    }
                    .padding(12.dp)
                    .semantics {
                        contentDescription = if (fragments.isEmpty()) {
                            "${character.name}, nothing decoded"
                        } else {
                            "${character.name}, ${fragments.size} notes decoded"
                        }
                    },
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
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
                    // A bare dash read as a placeholder rather than as "none".
                    Text(
                        text = if (fragments.isEmpty()) {
                            "No notes"
                        } else if (fragments.size == 1) {
                            "1 note"
                        } else {
                            "${fragments.size} notes"
                        },
                        style = MaterialTheme.typography.labelLarge,
                        color = if (fragments.isEmpty()) colors.paperRule else colors.brass,
                    )
                }

                if (expanded == character.id) {
                    if (fragments.isEmpty()) {
                        Text(
                            text = "Nothing on file yet. Decode an edition that names them.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.paperRule,
                            modifier = Modifier.padding(top = 8.dp),
                        )
                    } else {
                        fragments.forEach { fragment ->
                            Column(Modifier.padding(top = 12.dp)) {
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
            }
        }
    }
}

/**
 * Renders a dossier note. Decoded quotes are set in the typewriter face and
 * italicised, so the player's own solved text reads as evidence rather than as
 * more of the narrator's prose.
 */
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
