package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import kotlin.random.Random

/**
 * Drills off the Primer.
 *
 * The property that matters is not which quote comes back but that a drill is
 * recognisable as one: everything that writes to the desk, the campaign count,
 * the leaderboard or the public counters gates on
 * [Edition.isPracticePuzzle], so a drill that failed that check would be
 * recorded as a real solve and pad the player's campaign.
 */
class PrimerPracticeTest {

    private val json = Json { ignoreUnknownKeys = false }

    private fun content(name: String) =
        javaClass.getResourceAsStream("/content/$name")!!.bufferedReader().use { it.readText() }

    private val puzzles: List<PuzzleData> = json.decodeFromString(content("puzzles.json"))

    private val pool = listOf("ONE FISH TWO FISH", "RED FISH BLUE FISH", "A THIRD DRILL")

    @Test
    fun `a drill is a practice puzzle and not the Primer`() {
        val drill = PrimerPractice.create(puzzles, pool)!!
        assertTrue(Edition.isPracticePuzzle(drill), "a drill must read as practice")
        assertFalse(Edition.isPrimerPuzzle(drill), "a drill must not read as the Primer")
    }

    @Test
    fun `a drill carries the Primer's edition, so it shares its wallet`() {
        val primer = puzzles.first { Edition.isPrimerPuzzle(it) }
        val drill = PrimerPractice.create(puzzles, pool)!!
        // Not cosmetic: the hint and check wallets are per edition, so a drill
        // spends the Primer's three rather than minting itself a fresh set.
        assertEquals(primer.editionNumber, drill.editionNumber)
    }

    @Test
    fun `two drills never share an id`() {
        // The desk keys saved progress by puzzle id. A repeated id would restore
        // the previous drill's board on top of the new quote.
        val ids = (0 until 50)
            .map { PrimerPractice.create(puzzles, pool, random = Random(it), now = { 1L })!!.id }
            .toSet()
        assertEquals(50, ids.size, "expected a distinct id per drill")
    }

    @Test
    fun `the quote just solved is not handed straight back`() {
        repeat(40) { seed ->
            val drill = PrimerPractice.create(
                puzzles,
                pool,
                excludeText = "ONE FISH TWO FISH",
                random = Random(seed),
            )!!
            assertNotEquals("ONE FISH TWO FISH", drill.originalText)
        }
    }

    @Test
    fun `a pool of one repeats rather than returning nothing`() {
        val only = listOf("THE ONLY DRILL")
        val drill = PrimerPractice.create(puzzles, only, excludeText = "THE ONLY DRILL")!!
        assertEquals("THE ONLY DRILL", drill.originalText)
    }

    @Test
    fun `the Primer's own letter clues do not travel to a drill`() {
        // They name letters in the Primer's quote, which the drill does not use.
        val drill = PrimerPractice.create(puzzles, pool)!!
        assertTrue(drill.hints.isEmpty())
    }

    @Test
    fun `no Primer and no pool both yield nothing rather than a broken board`() {
        assertNull(PrimerPractice.create(puzzles, emptyList()))
        assertNull(PrimerPractice.create(puzzles.filterNot { Edition.isPrimerPuzzle(it) }, pool))
    }

    @Test
    fun `the archive card reads as practice without being a real drill`() {
        val card = PrimerPractice.archiveCard(puzzles)!!
        assertEquals(PrimerPractice.SLOT_ID, card.id)
        assertTrue(Edition.isPracticePuzzle(card))
    }

    @Test
    fun `every shipped practice quote is solvable as a cryptogram`() {
        // The pool is authored prose. A quote with no letters, or one longer
        // than the board can lay out, would produce a drill nobody can finish.
        val shipped: PrimerPracticeFixture =
            json.decodeFromString(content("primerPractice.json"))
        assertTrue(shipped.practicePuzzles.isNotEmpty())
        for (text in shipped.practicePuzzles) {
            assertTrue(text.any { it.isLetter() }, "\"$text\" has no letters to decode")
            assertEquals(text.uppercase(), text, "\"$text\" is not upper case")
        }
    }
}

@kotlinx.serialization.Serializable
data class PrimerPracticeFixture(val practicePuzzles: List<String>)
