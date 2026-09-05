package com.chroniclecryptogram.board

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.content.CipherTactic
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import com.chroniclecryptogram.designsystem.theme.ChronicleTypography

const val PrimerCoachTag = "primer-coach"

/**
 * The extra line the coach adds to each tactic, keyed by tactic id.
 *
 * Ported verbatim from the web build. These are specific to the Primer's own
 * quote -- they name the actual words in it -- which is exactly why the coach
 * only appears on edition 0 and nowhere else.
 */
private val PrimerHints = mapOf(
    "singles" to "This dispatch opens on a lone mark. Nine times out of ten that is I. " +
        "You will meet a lonely A later.",
    "frequency" to "Tally the marks. The loudest ones are usually E or T. " +
        "That is how the language breathes.",
    "short-words" to "THE shows twice. AND is right behind it. Once T is in ink, " +
        "AT is a cheap two-letter word.",
    "apostrophes" to "CAN'T hides an apostrophe. The letter after it is usually S, T, D, or M " +
        "-- and N'T hands you both N and T.",
    "doubles" to "SEE hides EE in a short word. LOOK and TOO hide OO. LETTER hides TT. " +
        "Doubles do not lie on the morning edition.",
)

/** Above this font scale the coach starts folded. Below it, everything fits. */
private const val FoldAboveScale = 1.3f

/** True once the player has correctly placed [letter] somewhere on the board. */
private fun letterMapped(
    words: List<CryptogramWord>,
    mappings: Map<String, String>,
    letter: String,
): Boolean = words.any { word ->
    word.symbols.any { symbol ->
        !symbol.isPunctuation &&
            symbol.targetLetter == letter &&
            mappings[symbol.symbolId] == letter
    }
}

/**
 * The five tells of English, on the Primer only.
 *
 * It opens on the first tell the player has *not* yet demonstrated, so it teaches
 * rather than nags, and they can page back through the ones they have already
 * cleared.
 */
@Composable
fun PrimerCoach(
    tactics: List<CipherTactic>,
    words: List<CryptogramWord>,
    mappings: Map<String, String>,
    isSolved: Boolean,
    modifier: Modifier = Modifier,
) {
    if (tactics.isEmpty()) return
    val colors = ChronicleTheme.colors

    val done = remember(tactics, words, mappings) {
        tactics.map { tactic ->
            when (tactic.id) {
                "singles" -> letterMapped(words, mappings, "I")
                "frequency" ->
                    letterMapped(words, mappings, "E") || letterMapped(words, mappings, "T")
                "short-words" ->
                    letterMapped(words, mappings, "T") &&
                        letterMapped(words, mappings, "H") &&
                        letterMapped(words, mappings, "E")
                "apostrophes" ->
                    letterMapped(words, mappings, "N") && letterMapped(words, mappings, "T")
                "doubles" -> letterMapped(words, mappings, "O")
                else -> false
            }
        }
    }

    val unlocked = done.indexOfFirst { !it }.let { if (isSolved || it == -1) tactics.lastIndex else it }
    var index by remember { mutableIntStateOf(unlocked) }
    LaunchedEffect(unlocked) { index = unlocked }

    // At large type the coach and the masthead together fill the whole screen,
    // and the player arrives on the Primer unable to see the cipher at all --
    // on the one screen whose entire point is the cipher. So it starts folded
    // there, showing the tell's title in the rail, and opens on a tap.
    val fontScale = LocalDensity.current.fontScale
    var open by remember(fontScale) { mutableStateOf(fontScale <= FoldAboveScale) }

    val tactic = tactics[index.coerceIn(tactics.indices)]
    val cleared = isSolved || done.getOrElse(index) { false }

    Column(
        modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp)
            .clip(RoundedCornerShape(4.dp))
            .border(2.dp, colors.ink, RoundedCornerShape(4.dp))
            .background(colors.paper)
            .testTag(PrimerCoachTag),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(colors.paperMasthead)
                .clickable { open = !open }
                .padding(start = 12.dp)
                .semantics {
                    contentDescription = if (open) {
                        "Five tells of English, showing. Tap to fold."
                    } else {
                        "Five tells of English, folded. Tap to read tell ${index + 1}."
                    }
                },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                // Folded, the rail carries the tell's own title, so the coach
                // still teaches at a glance rather than becoming a closed box.
                text = if (open) "Five tells of English" else tactic.title,
                style = ChronicleTypography.labelLarge,
                color = colors.ink,
                fontSize = 12.sp,
                letterSpacing = 1.sp,
                fontWeight = FontWeight.Black,
                // Two lines at large type rather than "Five tells of" and a cut
                // edge. The rail grows; nothing is lost.
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = 6.dp)
                    .semantics { heading() },
            )
            IconButton(
                onClick = { index = (index - 1).coerceAtLeast(0) },
                enabled = index > 0,
                modifier = Modifier.semantics { contentDescription = "Previous tell" },
            ) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, null, tint = colors.ink)
            }
            Text(
                text = "${index + 1} of ${tactics.size}",
                color = colors.paperRule,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1,
                softWrap = false,
                modifier = Modifier.widthIn(min = 52.dp),
            )
            IconButton(
                onClick = { index = (index + 1).coerceAtMost(tactics.lastIndex) },
                enabled = index < tactics.lastIndex,
                modifier = Modifier.semantics { contentDescription = "Next tell" },
            ) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = colors.ink)
            }
        }

        if (!open) return@Column

        Column(Modifier.padding(10.dp)) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(3.dp))
                    // A cleared tell goes quiet; the one being taught keeps the
                    // brass rule so the eye lands on it.
                    .border(
                        width = if (cleared) 1.dp else 2.dp,
                        color = if (cleared) colors.paperRule else colors.brass,
                        shape = RoundedCornerShape(3.dp),
                    )
                    .background(colors.paperCard)
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "${index + 1}",
                        color = colors.brass,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.size(14.dp),
                    )
                    Text(
                        text = tactic.title.uppercase(),
                        style = ChronicleTypography.labelLarge,
                        color = colors.ink,
                        fontSize = 11.sp,
                        letterSpacing = 0.8.sp,
                        fontWeight = FontWeight.Black,
                    )
                }
                Text(
                    text = listOfNotNull(tactic.summary, PrimerHints[tactic.id])
                        .joinToString(" "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.paperRule,
                )
            }
        }
    }
}
