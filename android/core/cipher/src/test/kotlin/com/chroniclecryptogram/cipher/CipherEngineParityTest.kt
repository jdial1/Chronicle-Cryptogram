package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
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
 * Asserts the Kotlin cipher produces byte-identical output to the shipped web
 * game for all 61 puzzles. See fixtures/README.md.
 */
class CipherEngineParityTest {

    @Test
    fun `palette matches the TypeScript, in order`() {
        val expected = Fixtures.obj("palette")["symbols"]!!.jsonArray
        assertEquals(expected.size, ZodiacSymbolsPalette.size)
        expected.forEachIndexed { index, element ->
            val symbol = ZodiacSymbolsPalette[index]
            val obj = element.jsonObject
            assertEquals(obj["id"]!!.jsonPrimitive.content, symbol.id, "id at $index")
            assertEquals(obj["glyph"]!!.jsonPrimitive.content, symbol.glyph, "glyph at $index")
            assertEquals(obj["name"]!!.jsonPrimitive.content, symbol.name, "name at $index")
            assertEquals(
                obj["category"]!!.jsonPrimitive.content,
                symbol.category.name.lowercase(),
                "category at $index",
            )
        }
    }

    @TestFactory
    fun `buildCipherAlphabet matches the TypeScript`(): List<DynamicTest> =
        Fixtures.array("cipher-alphabet").map { element ->
            val entry = element.jsonObject
            val puzzleId = entry["puzzleId"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(puzzleId) {
                val actual = CipherEngine.buildCipherAlphabet(
                    seed = entry["seed"]!!.jsonPrimitive.content,
                    homophonic = entry["homophonic"]!!.jsonPrimitive.boolean,
                )

                val expectedLetters = entry["letterToSymbols"]!!.jsonObject
                assertEquals(expectedLetters.keys, actual.letterToSymbols.keys, "letters")
                for ((letter, symbols) in expectedLetters) {
                    val expectedList = symbols.jsonArray
                    val actualList = actual.letterToSymbols.getValue(letter)
                    assertEquals(expectedList.size, actualList.size, "allocation count for $letter")
                    expectedList.forEachIndexed { index, expectedSymbol ->
                        val obj = expectedSymbol.jsonObject
                        val got = actualList[index]
                        assertEquals(obj["id"]!!.jsonPrimitive.content, got.id, "$letter[$index] id")
                        assertEquals(obj["glyph"]!!.jsonPrimitive.content, got.glyph, "$letter[$index] glyph")
                        assertEquals(obj["name"]!!.jsonPrimitive.content, got.name, "$letter[$index] name")
                    }
                }

                val expectedInfo = entry["symbolIdToInfo"]!!.jsonObject
                assertEquals(expectedInfo.keys, actual.symbolIdToInfo.keys, "symbol ids")
                for ((id, info) in expectedInfo) {
                    val obj = info.jsonObject
                    val got = actual.symbolIdToInfo.getValue(id)
                    assertEquals(obj["glyph"]!!.jsonPrimitive.content, got.glyph, "$id glyph")
                    assertEquals(obj["targetLetter"]!!.jsonPrimitive.content, got.targetLetter, "$id letter")
                    assertEquals(obj["name"]!!.jsonPrimitive.content, got.name, "$id name")
                }
            }
        }

    @TestFactory
    fun `parseCryptogramText matches the TypeScript`(): List<DynamicTest> =
        Fixtures.array("cipher-words").map { element ->
            val entry = element.jsonObject
            val puzzleId = entry["puzzleId"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(puzzleId) {
                val map = CipherEngine.buildCipherAlphabet(
                    seed = puzzleId + entry["text"]!!.jsonPrimitive.content,
                    homophonic = entry["homophonic"]!!.jsonPrimitive.boolean,
                )
                val actual = CipherEngine.parseCryptogramText(
                    entry["text"]!!.jsonPrimitive.content,
                    map,
                )
                val expected = entry["words"]!!.jsonArray

                assertEquals(expected.size, actual.size, "word count")
                expected.forEachIndexed { wordIndex, expectedWord ->
                    val obj = expectedWord.jsonObject
                    val word = actual[wordIndex]
                    assertEquals(obj["id"]!!.jsonPrimitive.content, word.id, "word id")
                    val expectedCells = obj["symbols"]!!.jsonArray
                    assertEquals(expectedCells.size, word.symbols.size, "cell count in ${word.id}")
                    expectedCells.forEachIndexed { cellIndex, expectedCell ->
                        val cellObj = expectedCell.jsonObject
                        val cell = word.symbols[cellIndex]
                        val where = "${word.id}[$cellIndex]"
                        assertEquals(cellObj["symbolId"]!!.jsonPrimitive.content, cell.symbolId, "$where symbolId")
                        assertEquals(
                            cellObj["targetLetter"]!!.jsonPrimitive.content,
                            cell.targetLetter,
                            "$where targetLetter",
                        )
                        assertEquals(
                            cellObj["isPunctuation"]?.jsonPrimitive?.booleanOrNull ?: false,
                            cell.isPunctuation,
                            "$where isPunctuation",
                        )
                        assertEquals(cellObj["char"]?.jsonPrimitive?.content, cell.char, "$where char")
                    }
                }
            }
        }

    @TestFactory
    fun `calculateSymbolFrequencies matches the TypeScript`(): List<DynamicTest> {
        val words = Fixtures.array("cipher-words")
            .associateBy { it.jsonObject["puzzleId"]!!.jsonPrimitive.content }

        return Fixtures.array("frequencies").map { element ->
            val entry = element.jsonObject
            val puzzleId = entry["puzzleId"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(puzzleId) {
                val source = words.getValue(puzzleId).jsonObject
                val map = CipherEngine.buildCipherAlphabet(
                    seed = puzzleId + source["text"]!!.jsonPrimitive.content,
                    homophonic = source["homophonic"]!!.jsonPrimitive.boolean,
                )
                val parsed = CipherEngine.parseCryptogramText(source["text"]!!.jsonPrimitive.content, map)
                val actual = CipherEngine.calculateSymbolFrequencies(parsed, map)
                val expected = entry["frequencies"]!!.jsonArray

                assertEquals(expected.size, actual.size, "row count")
                expected.forEachIndexed { index, expectedRow ->
                    val obj = expectedRow.jsonObject
                    val row = actual[index]
                    // Order is part of the contract: ties must keep first-appearance order.
                    assertEquals(obj["symbolId"]!!.jsonPrimitive.content, row.symbolId, "row $index symbolId")
                    assertEquals(obj["glyph"]!!.jsonPrimitive.content, row.glyph, "row $index glyph")
                    assertEquals(obj["count"]!!.jsonPrimitive.int, row.count, "row $index count")
                    assertEquals(
                        obj["percentage"]!!.jsonPrimitive.double,
                        row.percentage,
                        1e-12,
                        "row $index percentage",
                    )
                    assertEquals(
                        obj["targetLetter"]!!.jsonPrimitive.content,
                        row.targetLetter,
                        "row $index targetLetter",
                    )
                }
            }
        }
    }
}
