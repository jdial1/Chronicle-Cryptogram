package com.chroniclecryptogram.casefile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.content.CaseFileContent
import com.chroniclecryptogram.content.CaseFiles
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * The case file must not leak the story, and the way it used to leak it was by
 * listing the whole cast up front: seven dossiers, every one of them empty,
 * which tells a new player exactly who the season is about before they have
 * decoded a word. A person appears here only once something is on file for
 * them.
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

    private fun morning(edition: Int) = Edition.morningPuzzleForEdition(puzzles, edition)!!

    /** Who edition [edition] actually names, which is what should be on file. */
    private fun named(edition: Int) = content.fragments
        .filter { it.editionNumber == edition }
        .map { it.characterId }
        .toSet()

    @Test
    fun `a fresh player sees an explanation, not a cast list`() {
        show(emptySet())

        compose.onNodeWithContentDescription(
            "No dossiers yet. Decode an edition to open one.",
        ).assertExists()

        // The names are the spoiler. None of them may appear.
        for (character in content.characters) {
            compose.onNodeWithText(character.name).assertDoesNotExist()
            compose.onNodeWithText(dossierTab(character.name).uppercase()).assertDoesNotExist()
        }
    }

    @Test
    fun `only the people an edition names get a dossier`() {
        val edition = morning(1)
        show(setOf(edition.id))
        val onFile = named(1)
        assertTrue("edition 1 should name someone", onFile.isNotEmpty())

        for (character in content.characters) {
            val label = dossierTab(character.name).uppercase()
            if (character.id in onFile) {
                compose.onNodeWithText(label).assertExists()
            } else {
                // Still unmentioned, so still not in the file.
                compose.onNodeWithText(label).assertDoesNotExist()
            }
        }
    }

    @Test
    fun `the open dossier shows that person's notes`() {
        val edition = morning(1)
        show(setOf(edition.id))

        val first = content.characters.first { it.id in named(1) }
        val notes = CaseFiles.unlockedFragmentsForCharacter(
            first.id, content, puzzles, setOf(edition.id),
        )
        assertTrue(notes.isNotEmpty())

        compose.onNodeWithText(dossierTab(first.name).uppercase()).performClick()
        compose.onNodeWithContentDescription(
            "${first.name}, ${notes.size} notes decoded",
        ).assertExists()
        compose.onNodeWithText(notes.first().title).assertExists()
    }

    @Test
    fun `a tab is the given name, not the honorific`() {
        // Three of the seven are Vances and two carry titles, so neither the
        // surname nor the first word of the full name tells them apart.
        assertEquals("Elias", dossierTab("Detective Elias Thorne"))
        assertEquals("Aris", dossierTab("Dr. Aris Blackwood"))
        assertEquals("Reginald", dossierTab("Reginald"))
        assertEquals(
            "every dossier needs a tab label of its own",
            content.characters.size,
            content.characters.map { dossierTab(it.name) }.toSet().size,
        )
    }
}
