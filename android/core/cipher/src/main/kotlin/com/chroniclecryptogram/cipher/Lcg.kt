package com.chroniclecryptogram.cipher

import kotlin.math.abs

/**
 * The seeded shuffle behind cipher glyph assignment, ported from
 * `src/utils/cipherEngine.ts`.
 *
 * Glyph assignment is recomputed on every device and never stored, so this must
 * agree with the TypeScript bit for bit or the same save shows a different cipher
 * on Android than on the web. `src/test/resources/fixtures/lcg.json` pins it.
 *
 * Two things here are deliberate and look wrong at a glance:
 *
 *  - [hashSeed] returns `Int` and is *allowed* to overflow. That reproduces the
 *    `hash |= 0` truncation in the JavaScript. Widening it would change the hash.
 *  - [nextSeed] takes and returns `Long`. The JavaScript runs on doubles, where
 *    nothing wraps; in `Int` arithmetic `233279 * 9301 = 2_169_628_379` is past
 *    `Int.MAX_VALUE`, and the first step operates on `abs(hash)` -- up to ~2.1e9 --
 *    times 9301, around 2e13.
 */
internal object Lcg {

    /** JS: `hash = (hash << 5) - hash + charCodeAt(i); hash |= 0`. */
    fun hashSeed(seed: String): Int {
        var hash = 0
        for (char in seed) {
            hash = (hash shl 5) - hash + char.code
        }
        return hash
    }

    /** JS: `(currentSeed * 9301 + 49297) % 233280`, evaluated on doubles. */
    fun nextSeed(currentSeed: Long): Long = (currentSeed * 9301L + 49297L) % 233280L

    /**
     * JS `Math.abs(hashSeed(...))`. Widen before taking the absolute value:
     * `abs(Int.MIN_VALUE)` is still `Int.MIN_VALUE`, while JavaScript yields the
     * double 2147483648.
     */
    fun startSeed(seed: String): Long = abs(hashSeed(seed).toLong())

    /**
     * Fisher-Yates over [size] items, returning the swap partner for each step.
     * JS: `Math.floor((currentSeed / 233280) * (i + 1))`.
     */
    fun shuffleOrder(seed: String, size: Int): IntArray {
        val order = IntArray(size)
        var current = startSeed(seed)
        for (i in size - 1 downTo 1) {
            current = nextSeed(current)
            order[i] = ((current.toDouble() / 233280.0) * (i + 1)).toInt()
        }
        return order
    }
}
