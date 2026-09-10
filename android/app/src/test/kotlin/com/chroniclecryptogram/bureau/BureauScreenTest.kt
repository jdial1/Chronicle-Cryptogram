package com.chroniclecryptogram.bureau

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.ThemeMode
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The Bureau holds the only irreversible control in the app, so the thing worth
 * pinning is that it asks first -- and that nothing is posted under a name the
 * player never chose.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BureauScreenTest {

    @get:Rule
    val compose = createComposeRule()

    private var deleted = 0
    /** Every edit the screen asked for, applied to the prefs it was given. */
    private var edits = mutableListOf<DeskPrefs>()

    private fun show(
        prefs: DeskPrefs = DeskPrefs(),
        account: AccountState = AccountState(available = true, signedIn = true),
    ) {
        compose.setContent {
            ChronicleTheme(dark = false) {
                BureauScreen(
                    solvedCount = 3,
                    totalEditions = 30,
                    prefs = prefs,
                    account = account,
                    onPrefs = { edit -> edits += prefs.edit() },
                    onSignIn = {},
                    onSignOut = {},
                    onDeleteAccount = { deleted++ },
                )
            }
        }
    }

    @Test
    fun `deleting an account asks before it acts`() {
        show()

        compose.onNodeWithText("Delete account and data").performScrollTo().performClick()
        // The tap opens a dialog; it must not have deleted anything yet.
        assertEquals(0, deleted)

        compose.onNodeWithText("Keep it").performClick()
        assertEquals("dismissing the dialog must not delete", 0, deleted)

        compose.onNodeWithText("Delete account and data").performScrollTo().performClick()
        compose.onNodeWithText("Delete it").performClick()
        assertEquals(1, deleted)
    }

    @Test
    fun `the deletion warning says it cannot be undone`() {
        show()
        compose.onNodeWithText("Delete account and data").performScrollTo().performClick()

        compose.onNode(
            androidx.compose.ui.test.hasText("cannot be undone", substring = true)
        ).assertIsDisplayed()
    }

    @Test
    fun `a signed-out player is not offered account deletion`() {
        show(account = AccountState(available = true, signedIn = false))
        compose.onNodeWithText("Delete account and data").assertDoesNotExist()
    }

    @Test
    fun `an offline build shows no cloud section at all`() {
        // The 1.0 release ships with `chronicleCloud=false`, so this is the
        // configuration every paying player sees. Three whole sections go, and
        // the earlier version of this test only checked that two buttons were
        // absent -- which an "unavailable" notice would also have passed, while
        // still explaining a feature nobody had.
        show(account = AccountState(available = false, signedIn = false))

        compose.onNodeWithText("Account").assertDoesNotExist()
        compose.onNodeWithText("Posting").assertDoesNotExist()
        compose.onNodeWithText("The board").assertDoesNotExist()
        compose.onNodeWithText("Sign in with Google").assertDoesNotExist()
        compose.onNodeWithText("Delete account and data").assertDoesNotExist()
        compose.onNodeWithContentDescription("Codename").assertDoesNotExist()

        // What is left is the whole offline game: standing and settings.
        compose.onNodeWithText("The press").assertIsDisplayed()
        compose.onNodeWithContentDescription("Editions decoded, 3 of 30").assertIsDisplayed()
    }

    @Test
    fun `the codename is empty until the player types one`() {
        show()
        // Posting is publishing, so the placeholder is a prompt, not a default
        // that would quietly go on the board.
        compose.onNodeWithContentDescription("Codename").performScrollTo()
            .performTextInput("Nightdesk")
        assertTrue(edits.isNotEmpty())
        assertEquals("Nightdesk", edits.last().codename)
    }

    @Test
    fun `the paper control reports the mode it was given`() {
        show(prefs = DeskPrefs(themeMode = ThemeMode.Dark))
        compose.onNodeWithContentDescription("Paper Day").performScrollTo().performClick()
        assertEquals(listOf(ThemeMode.Light), edits.map { it.themeMode })
    }
}
