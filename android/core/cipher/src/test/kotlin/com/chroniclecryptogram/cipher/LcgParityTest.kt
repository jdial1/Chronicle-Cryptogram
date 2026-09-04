package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory

/**
 * The parity gate. If this goes red, the Kotlin cipher no longer agrees with the
 * shipped web game and Android players would see different glyphs for the same
 * puzzle.
 */
class LcgParityTest {

    private val fixture = Fixtures.obj("lcg")

    @TestFactory
    fun `hashSeed matches the TypeScript`(): List<DynamicTest> =
        fixture["hashSeed"]!!.jsonArray.map { entry ->
            val input = entry.jsonObject["input"]!!.jsonPrimitive.content
            val expected = entry.jsonObject["output"]!!.jsonPrimitive.int
            DynamicTest.dynamicTest("hashSeed(${input.take(32)})") {
                assertEquals(expected, Lcg.hashSeed(input))
            }
        }

    @TestFactory
    fun `nextSeed matches the TypeScript`(): List<DynamicTest> =
        fixture["nextSeed"]!!.jsonArray.map { entry ->
            val start = entry.jsonObject["start"]!!.jsonPrimitive.long
            val iterates = entry.jsonObject["iterates"]!!.jsonArray.map { it.jsonPrimitive.long }
            DynamicTest.dynamicTest("nextSeed from $start") {
                var seed = start
                iterates.forEachIndexed { step, expected ->
                    seed = Lcg.nextSeed(seed)
                    assertEquals(expected, seed, "diverged at step $step from start $start")
                }
            }
        }

    /**
     * The case that motivated exporting hashSeed at all: JS `Math.abs` on
     * -2147483648 widens to the double 2147483648, while Kotlin's `abs` on
     * `Int.MIN_VALUE` returns `Int.MIN_VALUE`. A port that skips the widening
     * feeds a negative seed into the shuffle and silently reorders the palette.
     */
    @Test
    fun `abs of the int32 minimum widens instead of staying negative`() {
        val preimage = fixture["intMinPreimage"]!!.jsonPrimitive.content
        assertEquals(Int.MIN_VALUE, Lcg.hashSeed(preimage), "fixture preimage is stale")
        assertEquals(2147483648L, Lcg.startSeed(preimage))
        assertTrue(Lcg.startSeed(preimage) > 0)
    }
}
