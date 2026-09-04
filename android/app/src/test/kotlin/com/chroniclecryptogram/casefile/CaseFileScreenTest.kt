package com.chroniclecryptogram.casefile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.content.CaseFileContent
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
 * The case file must not leak the story. A dossier entry appears only once the
 * player has decoded the edition it quotes, so the screen's job is to show
 * nothing before that and the right thing after.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class CaseFileScreenTest {

    @get:Rule
    val compose = createComposeRule()

    private val json = Json { ignoreUnknownKeys = false }
    private val root = File("../..").canonicalFile

    private val puzzles: List<PuzzleData> =
        json.decodeFromString(File(root, "src/data/puzzles.json").readText())

    private val content: CaseFileContent =
        json.decodeFromString(File(root, "src/data/caseFiles.json").readText())

    private var solved by mutableStateOf(emptySet<String>())

    private fun show(initial: Set<String>) {
        solved = initial
        compose.setContent {
            val current = solved
            ChronicleTheme(dark = false) {
                CaseFileScreen(content = content, puzzles = puzzles, solvedPuzzleIds = current)
            }
        }
    }

    private fun scrollTo(description: String) {
        compose.onNodeWithTag(CaseFileListTag)
            .performScrollToNode(hasContentDescription(description))
    }

    private fun morning(edition: Int) = Edition.morningPuzzleForEdition(puzzles, edition)!!

    @Test
    fun `a fresh player has nothing on file for anyone`() {
        show(emptySet())
        for (character in content.characters) {
            scrollTo("${character.name}, nothing decoded")
            compose.onNodeWithContentDescription("${character.name}, nothing decoded").assertExists()
        }
    }

    @Test
    fun `solving an edition puts notes on file for the people it names`() {
        show(setOf(morning(1).id))

        val named = content.fragments
            .filter { it.editionNumber == 1 }
            .map { it.characterId }
            .toSet()

        var withNotes = 0
        for (character in content.characters) {
            if (character.id !in named) continue
            scrollTo("${character.name}, 1 notes decoded")
            compose.onNodeWithContentDescription("${character.name}, 1 notes decoded").assertExists()
            withNotes++
        }
        require(withNotes > 0) { "edition 1 should name at least one character" }
    }

    @Test
    fun `an empty dossier says so rather than showing prose`() {
        show(emptySet())
        val character = content.characters.first()

        scrollTo("${character.name}, nothing decoded")
        compose.onNodeWithContentDescription("${character.name}, nothing decoded").performClick()

        compose.onNodeWithText(
            "Nothing on file yet. Decode an edition that names them.",
        ).assertExists()
    }
}
