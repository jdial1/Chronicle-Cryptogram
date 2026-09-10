package com.chroniclecryptogram.bureau

import androidx.compose.foundation.border
import com.chroniclecryptogram.designsystem.PaperList
import com.chroniclecryptogram.designsystem.ChroniclePanel
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.KeyboardMode
import com.chroniclecryptogram.data.ThemeMode
import com.chroniclecryptogram.data.TitleBadges
import com.chroniclecryptogram.designsystem.ChronicleDialog
import com.chroniclecryptogram.designsystem.DialogAction
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme

const val BureauListTag = "bureau-list"

/** What the account section knows about the player. */
data class AccountState(
    val available: Boolean,
    val signedIn: Boolean,
    val displayName: String? = null,
    val busy: Boolean = false,
    val error: String? = null,
)

/**
 * The Bureau File: the player's standing, their settings, and their account.
 *
 * Everything here is a preference or a fact about this player, which is why the
 * board lives here rather than as its own top-level destination -- it is a view
 * of where *they* stand.
 */
@Composable
fun BureauScreen(
    solvedCount: Int,
    totalEditions: Int,
    prefs: DeskPrefs,
    account: AccountState,
    /**
     * Edits a preference. One callback rather than six: every one of them did
     * the same thing to a different field, and each had to be named again in
     * the store, again here, again where this screen is wired up and again in
     * this screen's test.
     */
    onPrefs: (DeskPrefs.() -> DeskPrefs) -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onDeleteAccount: () -> Unit,
    modifier: Modifier = Modifier,
    board: @Composable () -> Unit = {},
) {
    val colors = ChronicleTheme.colors
    var confirmingDelete by remember { mutableStateOf(false) }

    if (confirmingDelete) {
        ChronicleDialog(
            title = "Delete account",
            onDismissRequest = { confirmingDelete = false },
            confirm = DialogAction(
                // Paired with "Keep it" and distinct from the dialog's own
                // title, so the destructive choice reads as a choice.
                label = "Delete it",
                onClick = {
                    confirmingDelete = false
                    onDeleteAccount()
                },
                destructive = true,
            ),
            dismiss = DialogAction(label = "Keep it", onClick = { confirmingDelete = false }),
        ) {
            Text(
                // Says exactly what goes and what stays. The solve receipts are
                // non-deletable by rule -- they carry no personal data, and
                // being able to delete one would let a client re-run the public
                // solve counters.
                text = "This deletes your account and everything filed under " +
                    "it: progress, posted times and your place on the board. " +
                    "It cannot be undone. Progress on this device is kept.",
                color = colors.ink,
            )
        }
    }

    PaperList(title = "Bureau File", testTag = BureauListTag, modifier = modifier) {
        item {
            // The campaign stat that replaced the streak, which only ever
            // incremented and was tautological under progression gating.
            ChroniclePanel {
                Text(
                    text = "Editions decoded",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.brass,
                )
                Text(
                    text = "$solvedCount / $totalEditions",
                    style = MaterialTheme.typography.displayMedium,
                    color = colors.ink,
                    modifier = Modifier.semantics {
                        contentDescription = "Editions decoded, $solvedCount of $totalEditions"
                    },
                )
            }
        }

        item {
            ChroniclePanel {
                SectionTitle("The press")

                SettingLabel("Paper")
                SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                    ThemeMode.entries.forEachIndexed { index, mode ->
                        SegmentedButton(
                            selected = prefs.themeMode == mode,
                            onClick = { onPrefs { copy(themeMode = mode) } },
                            shape = SegmentedButtonDefaults.itemShape(index, ThemeMode.entries.size),
                            colors = SegmentedButtonDefaults.colors(
                                activeContainerColor = colors.brass,
                                activeContentColor = colors.paper,
                                inactiveContainerColor = colors.paperCard,
                                inactiveContentColor = colors.ink,
                            ),
                            modifier = Modifier.semantics {
                                contentDescription = "Paper ${mode.label()}"
                            },
                        ) {
                            Text(mode.label(), maxLines = 1)
                        }
                    }
                }

                SettingRow(
                    title = "System keyboard",
                    // Said plainly: the typewriter is the house instrument, but
                    // it is a custom key bank, and some people type faster or
                    // more reliably on the keyboard they already use.
                    detail = "Type on your own keyboard instead of the typewriter.",
                    checked = prefs.keyboardMode == KeyboardMode.System,
                    onChange = {
                        val mode = if (it) KeyboardMode.System else KeyboardMode.Typewriter
                        onPrefs { copy(keyboardMode = mode) }
                    },
                )

                SettingRow(
                    title = "Reduce motion",
                    detail = "Still keys and no letter jitter.",
                    checked = prefs.reduceMotion,
                    onChange = { on -> onPrefs { copy(reduceMotion = on) } },
                )
            }
        }

        if (account.available) item {
            ChroniclePanel {
                SectionTitle("Posting")
                Text(
                    // Said plainly, because posting is publishing: the name goes
                    // on a board other people read.
                    text = "Times are posted under this name, where every other " +
                        "solver can see them. Leave it empty and nothing is posted.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.paperRule,
                )

                SettingLabel("Codename")
                OutlinedTextField(
                    value = prefs.codename,
                    onValueChange = { typed -> onPrefs { copy(codename = typed.take(24)) } },
                    singleLine = true,
                    placeholder = { Text("Unsigned", color = colors.paperRule) },
                    supportingText = { Text("${prefs.codename.length} of 24") },
                    colors = paperFieldColors(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .semantics { contentDescription = "Codename" },
                )

                SettingLabel("Title")
                TitlePicker(selected = prefs.titleBadge) { badge -> onPrefs { copy(titleBadge = badge) } }

                SettingLabel("Country")
                OutlinedTextField(
                    value = prefs.countryCode,
                    onValueChange = { typed ->
                        val code = typed.filter { c -> c.isLetter() }.take(2)
                        onPrefs { copy(countryCode = code) }
                    },
                    singleLine = true,
                    isError = prefs.countryCode.length != 2,
                    supportingText = { Text("Two letters, like US") },
                    colors = paperFieldColors(),
                    modifier = Modifier.semantics { contentDescription = "Country code" },
                )
            }
        }

        // Hidden, not disabled. An "unavailable" notice explains a feature to
        // someone who never knew it existed, and reads as something broken; a
        // player who has only ever seen this build has no account to miss. The
        // 1.0 release ships offline, so the whole section goes.
        if (account.available) item {
            ChroniclePanel {
                SectionTitle("Account")

                Text(
                    text = when {
                        account.signedIn ->
                            "Filed as ${account.displayName ?: "an anonymous solver"}."
                        else ->
                            "Sign in to carry your progress between devices and post times."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.ink,
                )
                account.error?.let { message ->
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.cinnabar,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
                if (account.signedIn) {
                    // Play requires an in-app route to delete the account,
                    // not just the data. It is deliberately plain text under
                    // the sign-out button rather than a second loud button:
                    // it is irreversible, and it asks before it acts.
                    TextButton(
                        onClick = { confirmingDelete = true },
                        modifier = Modifier
                            .padding(top = 4.dp)
                            .heightIn(min = 48.dp),
                    ) {
                        Text("Delete account and data", color = colors.cinnabar)
                    }
                }
                Button(
                    onClick = if (account.signedIn) onSignOut else onSignIn,
                    enabled = !account.busy,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brass,
                        contentColor = colors.paper,
                    ),
                    modifier = Modifier
                        .padding(top = 10.dp)
                        .heightIn(min = 48.dp),
                ) {
                    Text(
                        when {
                            account.busy -> "Working…"
                            account.signedIn -> "Sign out"
                            else -> "Sign in with Google"
                        }
                    )
                }
            }
        }

        if (account.available) item {
            ChroniclePanel {
                SectionTitle("The board")
                board()
            }
        }

        item {
            ChroniclePanel {
                SectionTitle("Type & credits")
                LicencesSection()
            }
        }
    }
}

/**
 * Ink on ruled paper, for the three text fields on this screen.
 *
 * Written out three times before this, identically but for one field dropping
 * the cursor colour -- which is exactly the drift a repeated recipe produces,
 * and it made the dropdown's caret Material purple on a page with no purple
 * anywhere else.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun paperFieldColors() = ChronicleTheme.colors.let { colors ->
    OutlinedTextFieldDefaults.colors(
        focusedTextColor = colors.ink,
        unfocusedTextColor = colors.ink,
        focusedBorderColor = colors.brass,
        unfocusedBorderColor = colors.paperRule,
        cursorColor = colors.brass,
    )
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        color = ChronicleTheme.colors.ink,
        modifier = Modifier.semantics { heading() },
    )
}

@Composable
private fun SettingLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        color = ChronicleTheme.colors.brass,
        modifier = Modifier.padding(top = 6.dp),
    )
}

/**
 * A labelled switch. The whole row is the target rather than the switch alone,
 * which is both easier to hit and what TalkBack expects.
 */
@Composable
private fun SettingRow(
    title: String,
    detail: String,
    checked: Boolean,
    onChange: (Boolean) -> Unit,
) {
    val colors = ChronicleTheme.colors
    Row(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .padding(top = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, color = colors.ink)
            Text(detail, style = MaterialTheme.typography.bodyMedium, color = colors.paperRule)
        }
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = colors.paper,
                checkedTrackColor = colors.brass,
                uncheckedThumbColor = colors.paperRule,
                uncheckedTrackColor = colors.paperMasthead,
            ),
            modifier = Modifier.semantics { contentDescription = title },
        )
    }
}

/**
 * The rank beside the name on the board.
 *
 * A dropdown rather than free text: the rules cap it at 60 characters, and the
 * web offers exactly this list, so a board read on either app looks the same.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TitlePicker(selected: String, onSelect: (String) -> Unit) {
    val colors = ChronicleTheme.colors
    var open by remember { mutableStateOf(false) }
    val current = selected.ifBlank { TitleBadges.last() }

    ExposedDropdownMenuBox(expanded = open, onExpandedChange = { open = it }) {
        OutlinedTextField(
            value = current,
            onValueChange = {},
            readOnly = true,
            singleLine = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(open) },
            colors = paperFieldColors(),
            modifier = Modifier
                .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
                .fillMaxWidth()
                .semantics { contentDescription = "Title, $current" },
        )
        ExposedDropdownMenu(
            expanded = open,
            onDismissRequest = { open = false },
            // The menu is a Material surface, not a themed one: left alone it
            // paints the default tonal lavender in the middle of the paper.
            containerColor = colors.paperCard,
        ) {
            TitleBadges.forEach { badge ->
                DropdownMenuItem(
                    text = { Text(badge, color = colors.ink) },
                    onClick = {
                        onSelect(badge)
                        open = false
                    },
                )
            }
        }
    }
}

private fun ThemeMode.label() = when (this) {
    ThemeMode.System -> "System"
    ThemeMode.Light -> "Day"
    ThemeMode.Dark -> "Night"
}
