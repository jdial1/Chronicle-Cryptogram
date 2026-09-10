package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.int
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory

/**
 * Progression gating parity. Runs against the real season from
 * `src/data/puzzles.json`, so these assertions cover the shipped content and not
 * a hand-built fake.
 */
class EditionParityTest {

    private val fixture = Fixtures.obj("progression")
    private val puzzles = Content.puzzles

    @Test
    fun `the season loads and matches the fixture's shape`() {
        assertEquals(fixture["maxEdition"]!!.jsonPrimitive.int, Edition.maxEdition(puzzles))
    }

    @Test
    fun `edition labels match`() {
        for (entry in fixture["editionLabels"]!!.jsonArray) {
            val obj = entry.jsonObject
            val edition = obj["edition"]!!.jsonPrimitive.int
            assertEquals(
                obj["label"]!!.jsonPrimitive.content,
                Edition.editionLabel(edition),
                "label for edition $edition",
            )
        }
    }

    @Test
    fun `chapters match, including the fallback past the last span`() {
        for (entry in fixture["chapters"]!!.jsonArray) {
            val obj = entry.jsonObject
            val edition = obj["edition"]!!.jsonPrimitive.int
            val expected = obj["chapter"]!!.jsonObject
            val actual = Edition.chapterForEdition(edition)
            assertEquals(expected["week"]!!.jsonPrimitive.int, actual.week, "week for $edition")
            assertEquals(expected["kicker"]!!.jsonPrimitive.content, actual.kicker, "kicker for $edition")
            assertEquals(expected["title"]!!.jsonPrimitive.content, actual.title, "title for $edition")
        }
    }

    @Test
    fun `groupIssues returns every issue regardless of solve state`() {
        val expected = fixture["issues"]!!.jsonArray
        val actual = Edition.groupIssues(puzzles)
        assertEquals(expected.size, actual.size, "issue count")
        expected.forEachIndexed { index, entry ->
            val obj = entry.jsonObject
            val issue = actual[index]
            assertEquals(obj["editionNumber"]!!.jsonPrimitive.int, issue.editionNumber, "edition at $index")
            assertEquals(obj["morningId"]!!.jsonPrimitive.contentOrNull, issue.morning?.id, "morning at $index")
            assertEquals(obj["nightId"]!!.jsonPrimitive.contentOrNull, issue.night?.id, "night at $index")
        }
    }

    @TestFactory
    fun `gating matches the TypeScript for every solved-id set`(): List<DynamicTest> =
        fixture["cases"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val solved = case["solvedIds"]!!.jsonArray.map { it.jsonPrimitive.content }

                assertEquals(
                    case["frontPageEdition"]!!.jsonPrimitive.int,
                    Edition.frontPageEdition(puzzles, solved),
                    "frontPageEdition for $name",
                )
                assertEquals(
                    case["currentMorningPuzzleId"]!!.jsonPrimitive.contentOrNull,
                    Edition.currentMorningPuzzle(puzzles, solved)?.id,
                    "currentMorningPuzzle for $name",
                )
                assertEquals(
                    case["seasonComplete"]!!.jsonPrimitive.boolean,
                    Edition.isSeasonComplete(puzzles, solved),
                    "isSeasonComplete for $name",
                )
                for (entry in case["nightUnlocked"]!!.jsonArray) {
                    val obj = entry.jsonObject
                    val edition = obj["edition"]!!.jsonPrimitive.int
                    assertEquals(
                        obj["unlocked"]!!.jsonPrimitive.boolean,
                        Edition.isNightUnlocked(puzzles, solved, edition),
                        "isNightUnlocked($edition) for $name",
                    )
                }
            }
        }
}
