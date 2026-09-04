package com.chroniclecryptogram.content

import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.TestFactory
import java.io.File

/**
 * Case-file assembly is prose the player reads, and the rules that shape it are
 * subtle enough to get wrong by eye -- I did, first time. Pinned against the
 * TypeScript rather than reasoned about.
 */
class CaseFilesParityTest {

    private val json = Json { ignoreUnknownKeys = false }

    private val repoRoot = File("../../..").canonicalFile

    private val fixture by lazy {
        val file = File(
            repoRoot,
            "android/core/cipher/src/test/resources/fixtures/case-files.json",
        )
        json.parseToJsonElement(file.readText()).jsonObject
    }

    private val puzzles: List<PuzzleData> by lazy {
        json.decodeFromString(File(repoRoot, "src/data/puzzles.json").readText())
    }

    private val content: CaseFileContent by lazy {
        json.decodeFromString(File(repoRoot, "src/data/caseFiles.json").readText())
    }

    @TestFactory
    fun `assembled fragments match the TypeScript`(): List<DynamicTest> =
        fixture["cases"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val solved = case["solvedIds"]!!.jsonArray
                    .map { it.jsonPrimitive.content }
                    .toSet()

                assertEquals(
                    case["hasDecodedFragments"]!!.jsonPrimitive.boolean,
                    CaseFiles.hasDecodedFragments(content, puzzles, solved),
                    "hasDecodedFragments for $name",
                )

                val expected = case["fragments"]!!.jsonArray
                assertEquals(expected.size, content.fragments.size, "fragment count")

                expected.forEachIndexed { index, entry ->
                    val obj = entry.jsonObject
                    val fragment = content.fragments[index]
                    val where = "$name/${obj["characterId"]!!.jsonPrimitive.content}" +
                        "/ed${obj["editionNumber"]!!.jsonPrimitive.int}"

                    val actual = CaseFiles.assemble(fragment, puzzles, solved)
                    val expectedAssembled = obj["assembled"]

                    if (expectedAssembled == null || expectedAssembled is JsonNull) {
                        assertNull(actual, "$where should be withheld")
                        return@forEachIndexed
                    }

                    val expectedObj = expectedAssembled.jsonObject
                    checkNotNull(actual) { "$where should be assembled" }
                    assertEquals(
                        expectedObj["title"]!!.jsonPrimitive.content,
                        actual.title,
                        "$where title",
                    )

                    val expectedSegments = expectedObj["segments"]!!.jsonArray
                    assertEquals(expectedSegments.size, actual.segments.size, "$where segment count")
                    expectedSegments.forEachIndexed { segmentIndex, segment ->
                        val segmentObj = segment.jsonObject
                        val got = actual.segments[segmentIndex]
                        assertEquals(
                            segmentObj["kind"]!!.jsonPrimitive.content,
                            got.kind.name.lowercase(),
                            "$where segment $segmentIndex kind",
                        )
                        // The exact string matters: this is the punctuation
                        // stitching where prose follows a decoded quote.
                        assertEquals(
                            segmentObj["value"]!!.jsonPrimitive.content,
                            got.value,
                            "$where segment $segmentIndex text",
                        )
                    }
                }
            }
        }

    /**
     * The punctuation stitching where prose follows a decoded quote. The shipped
     * content never lands on the branch that strips the quote's full stop, so
     * these fragments are synthetic and drive every seam deliberately.
     */
    @TestFactory
    fun `quote-to-prose seams match the TypeScript`(): List<DynamicTest> =
        fixture["seams"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest("seam/$name") {
                val fragment = json.decodeFromJsonElement(
                    CaseFragment.serializer(),
                    case["fragment"]!!,
                )
                val solved = setOf(
                    com.chroniclecryptogram.cipher.Edition
                        .morningPuzzleForEdition(puzzles, 1)!!.id
                )
                val actual = CaseFiles.assemble(fragment, puzzles, solved)
                val expected = case["assembled"]

                if (expected == null || expected is JsonNull) {
                    assertNull(actual, "seam $name should be withheld")
                    return@dynamicTest
                }

                val segments = expected.jsonObject["segments"]!!.jsonArray
                checkNotNull(actual) { "seam $name should assemble" }
                assertEquals(segments.size, actual.segments.size, "seam $name segment count")
                segments.forEachIndexed { index, segment ->
                    val obj = segment.jsonObject
                    assertEquals(
                        obj["kind"]!!.jsonPrimitive.content,
                        actual.segments[index].kind.name.lowercase(),
                        "seam $name segment $index kind",
                    )
                    assertEquals(
                        obj["value"]!!.jsonPrimitive.content,
                        actual.segments[index].value,
                        "seam $name segment $index text",
                    )
                }
            }
        }

    @TestFactory
    fun `per-character dossiers match the TypeScript`(): List<DynamicTest> =
        fixture["cases"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest("perCharacter/$name") {
                val solved = case["solvedIds"]!!.jsonArray
                    .map { it.jsonPrimitive.content }
                    .toSet()

                for (entry in case["perCharacter"]!!.jsonArray) {
                    val obj = entry.jsonObject
                    val characterId = obj["characterId"]!!.jsonPrimitive.content
                    val expected = obj["fragments"]!!.jsonArray
                    val actual = CaseFiles.unlockedFragmentsForCharacter(
                        characterId, content, puzzles, solved,
                    )
                    assertEquals(
                        expected.size,
                        actual.size,
                        "$name/$characterId fragment count",
                    )
                    expected.forEachIndexed { index, fragment ->
                        assertEquals(
                            fragment.jsonObject["title"]!!.jsonPrimitive.content,
                            actual[index].title,
                            "$name/$characterId fragment $index order",
                        )
                    }
                }
            }
        }
}
