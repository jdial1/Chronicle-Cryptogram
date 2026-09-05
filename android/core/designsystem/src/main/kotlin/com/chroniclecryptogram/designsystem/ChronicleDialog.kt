package com.chroniclecryptogram.designsystem

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

/**
 * One button on a dialog.
 *
 * [description] exists because the confirming button often repeats the title --
 * "Clear letters" under "Clear letters" -- and a screen reader landing on it
 * alone could not tell the question from the answer.
 */
data class DialogAction(
    val label: String,
    val onClick: () -> Unit,
    val destructive: Boolean = false,
    val description: String? = null,
)

/**
 * A slip of paper, not a Material surface.
 *
 * The stock 28dp corner radius is the single most recognisable Material tell,
 * and this app is printed, so every dialog squares its corners and takes an ink
 * rule instead. That recipe -- three content colours, a container colour, a
 * shape and a border modifier -- had been written out by hand in all three
 * places a dialog appears, which is how [ChroniclePanel] came to exist and for
 * the same reason.
 *
 * Only [confirm] is required. A dialog that merely shows something, like a
 * licence, has one button and no choice to make; the ones that do take an
 * action pass [dismiss] too, and it is the caller's job to make that the safe
 * half of the pair.
 */
@Composable
fun ChronicleDialog(
    title: String,
    onDismissRequest: () -> Unit,
    confirm: DialogAction,
    dismiss: DialogAction? = null,
    text: @Composable () -> Unit,
) {
    val colors = ChronicleTheme.colors
    val shape = RoundedCornerShape(4.dp)
    AlertDialog(
        onDismissRequest = onDismissRequest,
        containerColor = colors.paperCard,
        titleContentColor = colors.ink,
        textContentColor = colors.ink,
        shape = shape,
        modifier = Modifier.border(2.dp, colors.ink, shape),
        title = { Text(title, color = colors.ink) },
        text = text,
        confirmButton = { DialogButton(confirm) },
        dismissButton = dismiss?.let { { DialogButton(it) } },
    )
}

@Composable
private fun DialogButton(action: DialogAction) {
    val colors = ChronicleTheme.colors
    TextButton(
        onClick = action.onClick,
        modifier = if (action.description == null) {
            Modifier
        } else {
            Modifier.semantics { contentDescription = action.description }
        },
    ) {
        // Cinnabar is the app's one alarm colour, spent only on the half of a
        // pair that cannot be undone.
        Text(action.label, color = if (action.destructive) colors.cinnabar else colors.ink)
    }
}
