package com.chroniclecryptogram.bureau

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import com.chroniclecryptogram.designsystem.ChroniclePanel
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.widthIn
import com.chroniclecryptogram.designsystem.ReadingMeasure
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.KeyboardMode
import com.chroniclecryptogram.data.ThemeMode
import com.chroniclecryptogram.data.TitleBadges
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
    onThemeMode: (ThemeMode) -> Unit,
    onKeyboardMode: (KeyboardMode) -> Unit,
    onReduceMotion: (Boolean) -> Unit,
    onCodename: (String) -> Unit,
    onTitleBadge: (String) -> Unit,
    onCountryCode: (String) -> Unit,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onDeleteAccount: () -> Unit,
    modifier: Modifier = Modifier,
    board: @Composable () -> Unit = {},
) {
    val colors = ChronicleTheme.colors
    var confirmingDelete by remember { mutableStateOf(false) }

    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = { confirmingDelete = false },
            containerColor = colors.paperCard,
            titleContentColor = colors.ink,
            textContentColor = colors.ink,
            // As above: square corners and an ink rule, so a dialog reads as a
            // slip of paper rather than a Material surface.
            shape = RoundedCornerShape(4.dp),
            modifier = Modifier.border(2.dp, colors.ink, RoundedCornerShape(4.dp)),
            title = { Text("Delete account", color = colors.ink) },
            text = {
                Text(
                    // Says exactly what goes and what stays. The solve receipts
                    // are non-deletable by rule -- they carry no personal data,
                    // and being able to delete one would let a client re-run the
                    // public solve counters.
                    text = "This deletes your account and everything filed under " +
                        "it: progress, posted times and your place on the board. " +
                        "It cannot be undone. Progress on this device is kept.",
                    color = colors.ink,
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    confirmingDelete = false
                    onDeleteAccount()
                }) {
                    // Paired with "Keep it" and distinct from the dialog's
                    // own title, so the destructive choice reads as a choice.
                    Text("Delete it", color = colors.cinnabar)
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmingDelete = false }) {
                    Text("Keep it", color = colors.ink)
                }
            },
        )
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(colors.paper)
            .safeDrawingPadding()
            .testTag(BureauListTag),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        item {
            Text(
                text = "Bureau File",
                style = MaterialTheme.typography.displayMedium,
                color = colors.ink,
                modifier = Modifier
                    .widthIn(max = ReadingMeasure)
                    .fillMaxWidth()
                    .semantics { heading() },
            )
        }

        item {
            // The campaign stat that replaced the streak, which only ever
            // incremented and was tautological under progression gating.
            Card {
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
            Card {
                SectionTitle("The press")

                SettingLabel("Paper")
                SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                    ThemeMode.entries.forEachIndexed { index, mode ->
                        SegmentedButton(
                            selected = prefs.themeMode == mode,
                            onClick = { onThemeMode(mode) },
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
                        onKeyboardMode(if (it) KeyboardMode.System else KeyboardMode.Typewriter)
                    },
                )

                SettingRow(
                    title = "Reduce motion",
                    detail = "Still keys and no letter jitter.",
                    checked = prefs.reduceMotion,
                    onChange = onReduceMotion,
                )
            }
        }

        item {
            Card {
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
                    onValueChange = { onCodename(it.take(24)) },
                    singleLine = true,
                    placeholder = { Text("Unsigned", color = colors.paperRule) },
                    supportingText = { Text("${prefs.codename.length} of 24") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.ink,
                        unfocusedTextColor = colors.ink,
                        focusedBorderColor = colors.brass,
                        unfocusedBorderColor = colors.paperRule,
                        cursorColor = colors.brass,
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .semantics { contentDescription = "Codename" },
                )

                SettingLabel("Title")
                TitlePicker(selected = prefs.titleBadge, onSelect = onTitleBadge)

                SettingLabel("Country")
                OutlinedTextField(
                    value = prefs.countryCode,
                    onValueChange = { onCountryCode(it.filter { c -> c.isLetter() }.take(2)) },
                    singleLine = true,
                    isError = prefs.countryCode.length != 2,
                    supportingText = { Text("Two letters, like US") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.ink,
                        unfocusedTextColor = colors.ink,
                        focusedBorderColor = colors.brass,
                        unfocusedBorderColor = colors.paperRule,
                        cursorColor = colors.brass,
                    ),
                    modifier = Modifier.semantics { contentDescription = "Country code" },
                )
            }
        }

        item {
            Card {
                SectionTitle("Account")

                if (!account.available) {
                    Text(
                        // Honest about why, rather than showing a button that
                        // cannot work.
                        text = "This build has no bureau credentials, so sign-in " +
                            "and the board are unavailable. Everything else works offline.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.paperRule,
                    )
                } else {
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
        }

        item {
            Card {
                SectionTitle("The board")
                board()
            }
        }
    }
}

/** The Bureau's sections are plain panels; the name is kept for the call sites. */
@Composable
private fun Card(content: @Composable ColumnScope.() -> Unit) = ChroniclePanel(content = content)

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
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = colors.ink,
                unfocusedTextColor = colors.ink,
                focusedBorderColor = colors.brass,
                unfocusedBorderColor = colors.paperRule,
            ),
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
