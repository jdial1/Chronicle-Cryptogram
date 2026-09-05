package com.chroniclecryptogram.bureau

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The credits, which are a licence obligation rather than a courtesy.
 *
 * Eight TTFs ship in the APK under two licences that both require their text to
 * travel with the software, and nothing shipped it until 1.0. The assertions
 * below are the ones that would actually fail if that regressed: a family
 * dropped from the list, or a licence file the resource shrinker removed --
 * which would leave the dialog opening onto nothing and is invisible in a debug
 * build.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LicencesTest {

    @get:Rule
    val compose = createComposeRule()

    private fun show() {
        compose.setContent {
            ChronicleTheme(dark = false) {
                // A Column, because the section emits siblings and expects its
                // caller to stack them -- the Bureau puts it inside a panel.
                // Hosted bare, setContent's root box drew all five notices on
                // top of one another, and a tap meant for the first licence
                // landed on the fourth. Which was a fair warning about the
                // real screen: four buttons reading "SIL Open Font License 1.1"
                // and nothing else, now told apart by their descriptions.
                Column { LicencesSection() }
            }
        }
    }

    @Test
    fun `every bundled family is credited`() {
        show()
        for (family in listOf(
            "IM Fell English",
            "Newsreader",
            "Playfair Display",
            "Special Elite",
            "Chronicle Glyphs",
        )) {
            compose.onNodeWithText(family).assertIsDisplayed()
        }
    }

    @Test
    fun `the cipher face names the Noto families it was cut from`() {
        show()
        // Chronicle Glyphs is a merge of eight Noto subsets, so its notice is
        // theirs. Naming only "Chronicle Glyphs" would credit nobody.
        compose.onNode(hasText("Noto Sans Symbols 2", substring = true)).assertExists()
    }

    @Test
    fun `the full OFL text opens and is the real licence`() {
        show()
        // By description, not by cap: four buttons read "SIL Open Font License
        // 1.1" and nothing else, so the cap alone identifies none of them --
        // which is also what a screen reader was being handed until each one
        // was given its family.
        compose.onNodeWithContentDescription(
            "SIL Open Font License 1.1, IM Fell English",
        ).performClick()

        // A heading from the body of the licence rather than its title: the
        // title is also the button that opened it, so it would match even on an
        // empty dialog.
        compose.onNodeWithText("PERMISSION & CONDITIONS", substring = true).assertExists()
    }

    @Test
    fun `the Apache text opens for the one font that is not OFL`() {
        show()
        compose.onNodeWithText("Apache License 2.0").performClick()
        compose.onNode(
            hasText("TERMS AND CONDITIONS FOR USE, REPRODUCTION", substring = true)
        ).assertExists()
    }

    @Test
    fun `the section says plainly that nothing leaves the device`() {
        show()
        compose.onNode(hasText("no network permission", substring = true)).assertExists()
    }
}
