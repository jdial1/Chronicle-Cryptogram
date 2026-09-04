package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory

class CursorParityTest {

    private val fixture = Fixtures.obj("cursor")

    private val cells = fixture["cells"]!!.jsonArray.map {
        val obj = it.jsonObject
        BoardCell(
            cellId = obj["cellId"]!!.jsonPrimitive.content,
            symbolId = obj["symbolId"]!!.jsonPrimitive.content,
        )
    }

    @Test
    fun `letterCells matches the TypeScript for a real board`() {
        val puzzleId = fixture["puzzleId"]!!.jsonPrimitive.content
        val puzzle = Content.puzzles.first { it.id == puzzleId }
        val words = PuzzleState.cipherForPuzzle(puzzle).words
        assertEquals(cells, CipherCursor.letterCells(words))
        // Punctuation must not be selectable, so there are fewer cells than characters.
        assertTrue(cells.size < puzzle.originalText.length)
    }

    @Test
    fun `letterCells on no words is empty`() {
        assertEquals(0, fixture["letterCellsEmpty"]!!.jsonArray.size)
        assertEquals(emptyList<BoardCell>(), CipherCursor.letterCells(emptyList()))
    }

    @TestFactory
    fun `cellCursor matches the TypeScript`(): List<DynamicTest> =
        fixture["cellCursor"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest(case["name"]!!.jsonPrimitive.content) {
                assertEquals(
                    case["index"]!!.jsonPrimitive.int,
                    CipherCursor.cellCursor(
                        cells,
                        case["selectedSymbolId"]!!.jsonPrimitive.contentOrNull,
                        case["selectedCellId"]!!.jsonPrimitive.contentOrNull,
                    ),
                )
            }
        }

    @TestFactory
    fun `previousCell matches the TypeScript`(): List<DynamicTest> =
        fixture["previousCell"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest(case["name"]!!.jsonPrimitive.content) {
                val actual = CipherCursor.previousCell(
                    cells,
                    case["selectedSymbolId"]!!.jsonPrimitive.contentOrNull,
                    case["selectedCellId"]!!.jsonPrimitive.contentOrNull,
                )
                val expected = case["cell"]
                if (expected == null || expected is JsonNull) {
                    assertNull(actual)
                } else {
                    assertEquals(expected.jsonObject["cellId"]!!.jsonPrimitive.content, actual?.cellId)
                }
            }
        }

    /**
     * Includes the two cases that would hang or misbehave in a careless port: a
     * fully mapped board must return null rather than loop, and a search starting
     * at the last cell must wrap to the first.
     */
    @TestFactory
    fun `nextOpenCell matches the TypeScript`(): List<DynamicTest> =
        fixture["nextOpenCell"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val mappedCount = case["mappedSymbolCount"]!!.jsonPrimitive.int
                val mappings = when {
                    mappedCount == 0 -> emptyMap()
                    name.startsWith("all-but-first/") ->
                        cells.drop(1).associate { it.symbolId to "A" } - cells[0].symbolId
                    else -> cells.associate { it.symbolId to "A" }
                }
                assertEquals(mappedCount, mappings.size, "$name mapping count")

                val actual = CipherCursor.nextOpenCell(
                    cells,
                    case["selectedSymbolId"]!!.jsonPrimitive.contentOrNull,
                    case["selectedCellId"]!!.jsonPrimitive.contentOrNull,
                    mappings,
                )
                val expected = case["cell"]
                if (expected == null || expected is JsonNull) {
                    assertNull(actual, "$name should find no open cell")
                } else {
                    assertEquals(
                        expected.jsonObject["cellId"]!!.jsonPrimitive.content,
                        actual?.cellId,
                        name,
                    )
                }
            }
        }

    @Test
    fun `an empty board is safe`() {
        val empty = fixture["emptyBoard"]!!.jsonObject
        assertEquals(empty["cellCursor"]!!.jsonPrimitive.int, CipherCursor.cellCursor(emptyList(), null, null))
        assertNull(CipherCursor.nextOpenCell(emptyList(), null, null, emptyMap()))
        assertNull(CipherCursor.previousCell(emptyList(), null, null))
    }
}
