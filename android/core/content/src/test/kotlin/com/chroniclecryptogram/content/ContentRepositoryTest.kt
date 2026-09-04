package com.chroniclecryptogram.content

import com.chroniclecryptogram.cipher.Edition
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The schema guard. Bytes cannot drift -- Gradle stages the single copy under
 * src/data -- but the shape still can, so this fails the Android job on the same
 * PR as a TypeScript-side data change Kotlin cannot read.
 */
class ContentRepositoryTest {

    private val parser = ContentParser { name ->
        checkNotNull(javaClass.getResourceAsStream("/content/$name")) {
            "content/$name is not on the test classpath -- check stageContentForTests."
        }.bufferedReader().use { it.readText() }
    }

    @Test
    fun `every content file parses with unknown keys rejected`() {
        assertTrue(parser.puzzles().isNotEmpty())
        assertTrue(parser.caseFiles().characters.isNotEmpty())
        assertTrue(parser.cipherTactics().tactics.isNotEmpty())
        assertTrue(parser.primerPractice().practicePuzzles.isNotEmpty())
        assertTrue(parser.plates().plateIds.isNotEmpty())
    }

    @Test
    fun `the season is contiguous with one morning and one night per edition`() {
        val puzzles = parser.puzzles()
        val top = Edition.maxEdition(puzzles)

        for (edition in 1..top) {
            assertNotNull(
                Edition.morningPuzzleForEdition(puzzles, edition),
                "edition $edition has no Morning Edition",
            )
            assertNotNull(
                Edition.nightPuzzleForEdition(puzzles, edition),
                "edition $edition has no Night Extra",
            )
        }
    }

    @Test
    fun `puzzle ids are unique`() {
        val ids = parser.puzzles().map { it.id }
        assertEquals(ids.size, ids.distinct().size, "duplicate puzzle ids")
    }

    @Test
    fun `every case fragment points at a character and an edition that ships`() {
        val content = parser.caseFiles()
        val characterIds = content.characters.map { it.id }.toSet()
        val editions = parser.puzzles().map { it.editionNumber }.toSet()

        for (fragment in content.fragments) {
            assertTrue(
                fragment.characterId in characterIds,
                "fragment ${fragment.title} names unknown character ${fragment.characterId}",
            )
            assertTrue(
                fragment.editionNumber in editions,
                "fragment ${fragment.title} points at missing edition ${fragment.editionNumber}",
            )
        }
    }

    @Test
    fun `every plate reference resolves to a listed plate id`() {
        val plates = parser.plates()
        val ids = plates.plateIds.toSet()

        for ((character, plate) in plates.characterPlate) {
            assertTrue(plate in ids, "character $character maps to unknown plate $plate")
        }
        for ((edition, plate) in plates.locationByEdition) {
            assertTrue(plate in ids, "edition $edition maps to unknown plate $plate")
        }
        for (character in parser.caseFiles().characters) {
            assertTrue(character.plate in ids, "${character.id} has unknown plate ${character.plate}")
        }
    }

    /**
     * Proves the guard actually bites. Without `ignoreUnknownKeys = false` a
     * renamed field would parse as its default and the game would quietly ship
     * with missing content.
     */
    @Test
    fun `an unknown field fails the parse rather than being dropped`() {
        val strict = Json { ignoreUnknownKeys = false }
        val withExtra = """{"practicePuzzles":["A"],"somethingNew":1}"""
        assertThrows(SerializationException::class.java) {
            strict.decodeFromString<PrimerPracticeContent>(withExtra)
        }
    }
}
