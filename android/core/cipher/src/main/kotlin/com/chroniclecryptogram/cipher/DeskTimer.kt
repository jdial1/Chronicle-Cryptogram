package com.chroniclecryptogram.cipher

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * The solve clock, ported from `advanceDeskClock` in `src/hooks/useDeskTimer.ts`.
 *
 * The TypeScript rounds to one decimal on every tick (`+(s + step).toFixed(1)`)
 * because ten additions of 0.1 in binary floating point do not land on 1.0.
 * [BigDecimal] with HALF_UP matches `toFixed`, which also rounds half away from
 * zero -- `Math.round` on a Double would not, and neither would String.format
 * with its HALF_EVEN default.
 */
object DeskTimer {

    const val TICK_MS = 100L

    fun advanceDeskClock(seconds: Double, step: Double = 0.1): Double =
        BigDecimal(seconds + step).setScale(1, RoundingMode.HALF_UP).toDouble()
}
