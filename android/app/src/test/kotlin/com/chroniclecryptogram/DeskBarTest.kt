package com.chroniclecryptogram

import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The section rail's accessibility contract.
 *
 * The open section is marked by a cinnabar rule and heavier type, neither of
 * which a screen reader can see. Without `selected` on the node, TalkBack reads
 * five identical tabs and never says which one you are in -- and the visual
 * cue being correct is exactly why that goes unnoticed.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DeskBarTest {

    @get:Rule
    val compose = createComposeRule()

    private var went = mutableListOf<Destination>()

    private fun show(current: Destination) {
        compose.setContent {
            ChronicleTheme(dark = false) {
                DeskBar(current = current, onGo = { went += it })
            }
        }
    }

    @Test
    fun `the open section reports itself as selected`() {
        show(Destination.Archive)
        compose.onNodeWithContentDescription("Archive").assertIsSelected()
    }

    @Test
    fun `every other section reports itself as not selected`() {
        show(Destination.Archive)
        compose.onNodeWithContentDescription("Desk").assertIsNotSelected()
        compose.onNodeWithContentDescription("Case File").assertIsNotSelected()
        compose.onNodeWithContentDescription("Guide").assertIsNotSelected()
        compose.onNodeWithContentDescription("Bureau").assertIsNotSelected()
    }

    @Test
    fun `each section is reachable by its own name`() {
        show(Destination.Board)
        compose.onNodeWithContentDescription("Bureau").performClick()
        assertEquals(listOf(Destination.Desk), went)
    }
}
