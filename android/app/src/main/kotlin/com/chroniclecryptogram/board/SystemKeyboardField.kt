package com.chroniclecryptogram.board

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * The platform keyboard, for players who would rather use their own.
 *
 * The field is invisible and one dp square, but that is where the resemblance to
 * the web's hidden input ends. Compose owns the `InputConnection` and the focus,
 * so there is **no rect math**: the field never has to be positioned over the
 * selected tile, because `imePadding` on the screen handles the inset and the
 * board's own layout handles scrolling a tile into view. The web needs
 * `getBoundingClientRect`, scroll and `visualViewport` listeners and a 380ms
 * re-anchor timer to achieve the same thing.
 *
 * Autocorrect, suggestions and capitalisation are all off: this is one letter at
 * a time into a cipher, not prose.
 */
@Composable
fun SystemKeyboardField(
    /**
     * The selected cell, not merely whether one is selected: keying the effect
     * on the id re-opens the keyboard when the player picks a different glyph
     * after dismissing it, which a plain boolean cannot see.
     */
    selectedCellId: String?,
    onLetter: (String) -> Unit,
    onBackspace: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = ChronicleTheme.colors
    val enabled = selectedCellId != null
    val focus = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current
    // Reset to a single space after every keystroke, so a backspace always has
    // something to delete and is therefore always observable.
    var value by remember { mutableStateOf(" ") }

    LaunchedEffect(selectedCellId) {
        if (enabled) {
            // Focus first, then ask for the keyboard: show() only does anything
            // for a field that already holds focus.
            focus.requestFocus()
            keyboard?.show()
        } else {
            keyboard?.hide()
        }
    }

    Box(
        modifier
            .fillMaxWidth()
            .background(colors.paperMasthead)
            .padding(vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = if (enabled) {
                "Type a letter for the selected glyph."
            } else {
                "Tap a glyph on the board to start typing."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = colors.paperRule,
        )

        BasicTextField(
            value = value,
            onValueChange = { next ->
                when {
                    // Longer than the sentinel: the last character is the
                    // keystroke, whatever the IME chose to send.
                    next.length > value.length -> {
                        val typed = next.last()
                        if (typed.isLetter()) onLetter(typed.uppercase())
                    }
                    // Shorter: the sentinel was deleted, so that was a backspace.
                    next.length < value.length -> onBackspace()
                }
                value = " "
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                // Password type is the reliable way to suppress autocorrect and
                // the suggestion strip across OEM keyboards.
                keyboardType = KeyboardType.Password,
                capitalization = KeyboardCapitalization.Characters,
                autoCorrectEnabled = false,
                imeAction = ImeAction.None,
            ),
            modifier = Modifier
                .size(1.dp)
                .alpha(0f)
                .focusRequester(focus)
                // No .focusable(): BasicTextField is already a focus target, and
                // a second one in the same chain takes the focus instead --
                // which leaves the field unfocused and the IME never opens.
                .semantics { contentDescription = "Cipher letter entry" },
        )
    }
}
