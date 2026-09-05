package com.chroniclecryptogram.guide

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollToNode
import com.chroniclecryptogram.content.CipherTacticsContent
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * The guide describes the desk, so it has to describe *this* desk.
 *
 * It is driven by the same file the web reads, and the two desks have diverged
 * -- which is exactly how it came to document zoom controls this build does not
 * have while omitting a tool it does.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class GuideScreenTest {

    @get:Rule
    val compose = createComposeRule()

    private val tactics: CipherTacticsContent = run {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/cipherTactics.json").readText())
    }

    private fun show() {
        compose.setContent {
            ChronicleTheme(dark = false) { GuideScreen(tactics = tactics) }
        }
    }

    @Test
    fun `the guide does not document zoom controls this build removed`() {
        show()
        // Tiles are measured from sp text here, so the system font-size setting
        // is the zoom. There are no A-/A+ buttons to point a player at.
        compose.onNodeWithText("Smaller Type").assertDoesNotExist()
        compose.onNodeWithText("Larger Type").assertDoesNotExist()
    }

    @Test
    fun `the guide documents undo, which the dock has`() {
        show()
        compose.onNodeWithTag(GuideListTag).performScrollToNode(hasText("Undo"))
        compose.onNodeWithText("Undo").assertIsDisplayed()
    }

    @Test
    fun `the tools that did survive are still listed`() {
        show()
        compose.onNodeWithTag(GuideListTag).performScrollToNode(hasText("Glyph Tally"))
        compose.onNodeWithText("Glyph Tally").assertIsDisplayed()
        compose.onNodeWithText("Check Letter").assertIsDisplayed()
    }
}
