package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory

class PuzzleStateParityTest {

    private fun stringMap(element: kotlinx.serialization.json.JsonElement) =
        element.jsonObject.mapValues { (_, value) -> value.jsonPrimitive.content }

    private fun strings(element: kotlinx.serialization.json.JsonElement) =
        element.jsonArray.map { it.jsonPrimitive.content }

    @TestFactory
    fun `the answer key matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("puzzle-state")["puzzles"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val puzzleId = case["puzzleId"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest("decoded/$puzzleId") {
                val puzzle = Content.puzzles.first { it.id == puzzleId }
                assertEquals(
                    case["hard"]!!.jsonPrimitive.boolean,
                    Edition.isHardPuzzle(puzzle),
                    "difficulty mode",
                )
                assertEquals(
                    stringMap(case["decoded"]!!),
                    PuzzleState.decodedMappingsFromPuzzle(puzzle),
                )
            }
        }

    @TestFactory
    fun `withHintedMappings matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("puzzle-state")["puzzles"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val puzzleId = case["puzzleId"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest("withHintedMappings/$puzzleId") {
                val puzzle = Content.puzzles.first { it.id == puzzleId }
                val decoded = PuzzleState.decodedMappingsFromPuzzle(puzzle)
                val ids = decoded.keys.toList()
                assertEquals(
                    stringMap(case["withHintedMappings"]!!),
                    PuzzleState.withHintedMappings(
                        puzzle,
                        stringMap(case["mappings"]!!),
                        // An unknown id must be ignored rather than inserted.
                        listOf(ids[3], ids[4], "not_a_symbol"),
                    ),
                )
            }
        }

    @TestFactory
    fun `liveFlaggedIds matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("puzzle-state")["puzzles"]!!.jsonArray.flatMap { element ->
            val case = element.jsonObject
            val puzzleId = case["puzzleId"]!!.jsonPrimitive.content
            val puzzle = Content.puzzles.first { it.id == puzzleId }
            val mappings = stringMap(case["mappings"]!!)

            case["liveFlagged"]!!.jsonArray.map { flagElement ->
                val flagCase = flagElement.jsonObject
                val name = flagCase["name"]!!.jsonPrimitive.content
                DynamicTest.dynamicTest("liveFlaggedIds/$puzzleId/$name") {
                    assertEquals(
                        strings(flagCase["output"]!!),
                        PuzzleState.liveFlaggedIds(
                            puzzle,
                            mappings,
                            strings(flagCase["flagged"]!!),
                            strings(flagCase["locked"]!!),
                        ),
                        name,
                    )
                }
            }
        }
}
