package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory

/**
 * The numbers a finished puzzle reports. They end up in text the player posts
 * publicly, so a rounding or padding difference between the two surfaces is
 * visible to other people.
 */
class SolveParityTest {

    private val fixture = Fixtures.obj("solve")

    @TestFactory
    fun `formatTime matches the TypeScript`(): List<DynamicTest> =
        fixture["formatTime"]!!.jsonArray.map { element ->
            val entry = element.jsonObject
            val seconds = entry["seconds"]!!.jsonPrimitive.double
            val expected = entry["formatted"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest("$seconds -> $expected") {
                assertEquals(expected, Solve.formatTime(seconds))
            }
        }

    @TestFactory
    fun `accuracy matches the TypeScript`(): List<DynamicTest> =
        fixture["accuracy"]!!.jsonArray.map { element ->
            val entry = element.jsonObject
            val name = entry["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val answer = entry["answer"]!!.jsonObject
                    .mapValues { (_, v) -> v.jsonPrimitive.content }
                val mappings = entry["mappings"]!!.jsonObject
                    .mapValues { (_, v) -> v.jsonPrimitive.content }
                assertEquals(
                    entry["accuracy"]!!.jsonPrimitive.int,
                    Solve.accuracy(mappings, answer),
                    name,
                )
            }
        }

    /**
     * The share card is quoted verbatim by players, so its exact shape -- emoji,
     * line order, the trailing URL with no newline -- is part of the contract.
     */
    @Test
    fun `the share card reads exactly as the web writes it`() {
        val puzzle = PuzzleData(
            id = "day_7_easy",
            editionNumber = 7,
            title = "t",
            headline = "TRAGEDY AT THE VANCE ESTATE",
            subheadline = "s",
            authorOrSource = "a",
            originalText = "o",
            difficulty = "Easy",
            theme = "th",
            category = "Daily Featured",
        )

        val expected = listOf(
            "📰 CHRONICLE CRYPTOGRAM — EDITION #7",
            "🔍 Solved: \"TRAGEDY AT THE VANCE ESTATE\"",
            "⏱️ Time: 02:05.3",
            "🎯 Accuracy: 92%",
            "💡 Hints Used: 1",
            "Play Chronicle Cryptogram: ${Solve.SHARE_URL}",
        ).joinToString("\n")

        assertEquals(
            expected,
            Solve.shareText(puzzle, timerSeconds = 125.3, accuracy = 92, hintsUsed = 1),
        )
    }
}
