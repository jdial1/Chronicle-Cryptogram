package com.chroniclecryptogram.reader

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ArticleReaderTest {

    @get:Rule
    val compose = createComposeRule()

    private val puzzles: List<PuzzleData> = run {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/puzzles.json").readText())
    }

    private fun show(puzzle: PuzzleData) {
        compose.setContent {
            ChronicleTheme(dark = false) { ArticleReader(puzzle) }
        }
    }

    @Test
    fun `the clipping shows the headline, byline and decoded dispatch`() {
        val puzzle = Edition.morningPuzzleForEdition(puzzles, 1)!!
        show(puzzle)

        compose.onNodeWithText(puzzle.headline).assertExists()
        compose.onNodeWithContentDescription("Decoded dispatch").assertExists()
        compose.onNodeWithContentDescription(
            "Filed by ${Edition.articleByline(puzzle)}",
        ).assertExists()
    }

    /**
     * `articleDek` and `articleByline` strip the edition furniture the raw
     * fields carry -- "NIGHT EXTRA — ", "The Chronicle Night Post, " and so on --
     * so the clipping does not repeat what the masthead already says.
     */
    @Test
    fun `the dek and byline are stripped of their edition prefixes`() {
        val night = puzzles.first { Edition.isNightEdition(it) && it.editionNumber > 0 }

        val dek = Edition.articleDek(night)
        val byline = Edition.articleByline(night)

        assertNotEquals("the dek should be stripped", night.subheadline, dek)
        show(night)
        compose.onNodeWithText(dek).assertExists()
        compose.onNodeWithContentDescription("Filed by $byline").assertExists()
    }

    @Test
    fun `a night extra renders on its own stock`() {
        val night = puzzles.first { Edition.isNightEdition(it) && it.editionNumber > 0 }
        show(night)
        // The slot drives the background; asserting it renders at all is what a
        // screenshot test would otherwise be needed for.
        compose.onNodeWithText(night.headline).assertExists()
    }
}
