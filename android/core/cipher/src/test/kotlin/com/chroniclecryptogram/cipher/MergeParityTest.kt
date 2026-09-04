package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import com.chroniclecryptogram.cipher.model.Wallets
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory

/**
 * Merge, normalize and wallet parity. These are the subtlest functions in the
 * game: they decide what a player keeps when two devices disagree.
 */
class MergeParityTest {

    /** The clock reading `mergeProgress` mints when neither side carries a stamp. */
    private val fixedNow = 1_700_000_000_000L

    private val json = Json { ignoreUnknownKeys = false }

    private fun progressOf(element: JsonElement?): PuzzleProgress? =
        if (element == null || element is JsonNull) null
        else json.decodeFromJsonElement(PuzzleProgress.serializer(), element)

    private fun statsOf(element: JsonElement?): GameStats? =
        if (element == null || element is JsonNull) null
        else json.decodeFromJsonElement(GameStats.serializer(), element)

    private fun walletOf(element: JsonElement?): DailyHintWallet? =
        if (element == null || element is JsonNull) null
        else json.decodeFromJsonElement(DailyHintWallet.serializer(), element)

    @TestFactory
    fun `mergeProgress matches the TypeScript`(): List<DynamicTest> {
        val fixture = Fixtures.obj("merge-progress")
        val sentinel = fixture["freshStampSentinel"]!!.jsonPrimitive.content

        return fixture["progress"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val merged = Merge.mergeProgress(
                    local = progressOf(case["local"]),
                    cloud = progressOf(case["cloud"]),
                    now = { fixedNow },
                )
                val expected = case["merged"]

                if (expected == null || expected is JsonNull) {
                    assertNull(merged, "expected null merge for $name")
                    return@dynamicTest
                }

                val expectedObj = expected.jsonObject
                val stamp = expectedObj["updatedAt"]
                // "<now>" marks a stamp minted from the clock because neither input
                // carried one; anything else is an exact value the merge derived.
                val expectedProgress = if (stamp is JsonPrimitive && stamp.content == sentinel) {
                    progressOf(JsonObject(expectedObj + ("updatedAt" to JsonPrimitive(fixedNow))))
                } else {
                    progressOf(expectedObj)
                }

                assertEquals(expectedProgress, merged, "merge for $name")
            }
        }
    }

    @TestFactory
    fun `progressFields matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("merge-progress")["progressFields"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest(case["name"]!!.jsonPrimitive.content) {
                assertEquals(
                    progressOf(case["fields"]),
                    Merge.progressFields(progressOf(case["input"])!!),
                )
            }
        }

    @TestFactory
    fun `mergeGameStats matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("merge-progress")["gameStats"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest(case["name"]!!.jsonPrimitive.content) {
                assertEquals(
                    statsOf(case["merged"]),
                    Merge.mergeGameStats(statsOf(case["local"])!!, statsOf(case["cloud"])),
                )
            }
        }

    @TestFactory
    fun `mergeSolvedIds matches the TypeScript`(): List<DynamicTest> =
        Fixtures.obj("merge-progress")["solvedIds"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest(case["name"]!!.jsonPrimitive.content) {
                val strings = { key: String ->
                    case[key]!!.jsonArray.map { it.jsonPrimitive.content }
                }
                assertEquals(strings("merged"), Merge.mergeSolvedIds(strings("local"), strings("cloud")))
            }
        }

    @TestFactory
    fun `normalizeProgress matches the TypeScript`(): List<DynamicTest> {
        val fixture = Fixtures.obj("normalize-progress")
        return fixture["cases"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            val name = case["name"]!!.jsonPrimitive.content
            DynamicTest.dynamicTest(name) {
                val actual = Merge.normalizeProgress(case["raw"])
                val expected = case["normalized"]

                if (expected == null || expected is JsonNull) {
                    assertNull(actual, "expected null for $name")
                    return@dynamicTest
                }

                val expectedObj = expected.jsonObject
                // The documented divergence: TypeScript leaks NaN here and emits
                // null; an Int cannot, so Kotlin uses the absent-value fallback.
                val nanFields = expectedObj.filterValues { it is JsonNull }.keys
                    .filter { it == "hintsRemaining" || it == "checksRemaining" }
                if (nanFields.isNotEmpty()) {
                    assertEquals(Wallets.DAILY_HINTS, actual!!.hintsRemaining, "$name hintsRemaining")
                    assertEquals(Wallets.DAILY_CHECKS, actual.checksRemaining, "$name checksRemaining")
                    return@dynamicTest
                }

                assertEquals(progressOf(expectedObj), actual, "normalize for $name")
            }
        }
    }

    @TestFactory
    fun `clip helpers match the TypeScript`(): List<DynamicTest> {
        val fixture = Fixtures.obj("normalize-progress")
        val ids = fixture["clipHintedSymbolIds"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest("clipHintedSymbolIds/${case["name"]!!.jsonPrimitive.content}") {
                val input = (case["input"] as? kotlinx.serialization.json.JsonArray)
                    ?.map { (it as? JsonPrimitive)?.takeIf { p -> p.isString }?.content }
                assertEquals(
                    case["output"]!!.jsonArray.map { it.jsonPrimitive.content },
                    Merge.clipSymbolIds(input),
                )
            }
        }
        val selected = fixture["clipSelectedSymbolId"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest("clipSelectedSymbolId/${case["name"]!!.jsonPrimitive.content}") {
                val raw = case["input"]
                val input = (raw as? JsonPrimitive)?.takeIf { it.isString }?.content
                val expected = (case["output"] as? JsonPrimitive)?.takeIf { it !is JsonNull }?.content
                assertEquals(expected, Merge.clipSelectedSymbolId(input))
            }
        }
        return ids + selected
    }

    @Test
    fun `isEditionKey boundaries match`() {
        for (entry in Fixtures.obj("wallets")["isEditionKey"]!!.jsonArray) {
            val case = entry.jsonObject
            val raw = case["value"]!!.jsonPrimitive
            val value = if (raw.isString) Double.NaN else raw.double
            assertEquals(
                case["output"]!!.jsonPrimitive.boolean,
                Merge.isEditionKey(value),
                "isEditionKey(${raw.content})",
            )
        }
    }

    @Test
    fun `clipDailyWallet matches, including NaN and fractional input`() {
        for (entry in Fixtures.obj("wallets")["clipDailyWallet"]!!.jsonArray) {
            val case = entry.jsonObject
            val raw = case["used"]!!.jsonPrimitive
            val used = if (raw.isString) Double.NaN else raw.double
            assertEquals(
                walletOf(case["output"]),
                Merge.clipDailyWallet(
                    case["edition"]!!.jsonPrimitive.int,
                    used,
                    case["cap"]!!.jsonPrimitive.int,
                ),
                "clipDailyWallet(used=${raw.content}, cap=${case["cap"]})",
            )
        }
    }

    @TestFactory
    fun `wallet normalize and merge match`(): List<DynamicTest> {
        val fixture = Fixtures.obj("wallets")
        val normalize = fixture["normalizeDailyHints"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest("normalizeDailyHints/${case["name"]!!.jsonPrimitive.content}") {
                assertEquals(
                    walletOf(case["output"]),
                    Merge.normalizeDailyHints(
                        case["raw"],
                        case["edition"]!!.jsonPrimitive.int,
                        Wallets.DAILY_HINTS,
                    ),
                )
            }
        }
        val merge = fixture["mergeDailyHints"]!!.jsonArray.map { element ->
            val case = element.jsonObject
            DynamicTest.dynamicTest("mergeDailyHints/${case["name"]!!.jsonPrimitive.content}") {
                assertEquals(
                    walletOf(case["output"]),
                    Merge.mergeDailyHints(
                        walletOf(case["local"]),
                        walletOf(case["cloud"]),
                        edition = 1,
                        cap = Wallets.DAILY_HINTS,
                    ),
                )
            }
        }
        return normalize + merge
    }

    @Test
    fun `usedHintsFromProgress and usedChecksFromProgress match`() {
        val fixture = Fixtures.obj("wallets")
        val puzzles = fixture["puzzles"]!!.jsonArray.map {
            val obj = it.jsonObject
            obj["id"]!!.jsonPrimitive.content to obj["editionNumber"]!!.jsonPrimitive.int
        }
        val progressById = fixture["progressById"]!!.jsonObject
            .mapValues { (_, value) -> progressOf(value)!! }

        for (entry in fixture["usedFromProgress"]!!.jsonArray) {
            val case = entry.jsonObject
            val edition = case["edition"]!!.jsonPrimitive.int
            assertEquals(
                case["hints"]!!.jsonPrimitive.int,
                Merge.usedHintsFromProgress(edition, puzzles, progressById),
                "hints for edition $edition",
            )
            assertEquals(
                case["checks"]!!.jsonPrimitive.int,
                Merge.usedChecksFromProgress(edition, puzzles, progressById),
                "checks for edition $edition",
            )
        }
    }
}

private val JsonPrimitive.double: Double
    get() = doubleOrNull ?: Double.NaN

private val JsonPrimitive.boolean: Boolean
    get() = content.toBoolean()
