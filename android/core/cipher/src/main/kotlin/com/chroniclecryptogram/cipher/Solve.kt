package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData

/**
 * The numbers a finished puzzle reports, ported from `formatTime.ts` and the
 * accuracy `useMemo` in `App.tsx`.
 *
 * Pure, and here rather than in the UI, because the share text quotes them and a
 * wrong number is something a player posts publicly.
 */
object Solve {

    /** `mm:ss.t`, matching `src/utils/formatTime.ts` exactly. */
    fun formatTime(seconds: Double): String {
        val minutes = Math.floorDiv(seconds.toLong(), 60L)
        val secs = Math.floorMod(seconds.toLong(), 60L)
        // Tenths come off the unfloored value, so 12.94s reads .9 not .0.
        val tenths = ((seconds * 10).toLong() % 10).let { if (it < 0) it + 10 else it }
        return "%02d:%02d.%d".format(minutes, secs, tenths)
    }

    /**
     * Share of *assigned* symbols that are right, rounded. An untouched board is
     * 100%, not 0% -- accuracy measures the guesses made, not the board's
     * completeness.
     */
    fun accuracy(mappings: Map<String, String>, answer: Map<String, String>): Int {
        var correct = 0
        var assigned = 0
        for ((symbolId, truth) in answer) {
            val guess = mappings[symbolId]
            if (guess.isNullOrEmpty()) continue
            assigned++
            if (guess == truth) correct++
        }
        if (assigned == 0) return 100
        return Math.round(correct.toDouble() / assigned * 100).toInt()
    }

    /**
     * The score card a player posts. Byte-identical to the web's, so the same
     * solve shared from either surface reads the same.
     *
     * The URL is hard-coded rather than taken from the running app: on the web
     * it would carry the `?source=android` query the shell appends, and in a
     * native app there is no location to read at all.
     */
    fun shareText(
        puzzle: PuzzleData,
        timerSeconds: Double,
        accuracy: Int,
        hintsUsed: Int,
        url: String = SHARE_URL,
    ): String = buildString {
        append("📰 CHRONICLE CRYPTOGRAM — EDITION #${puzzle.editionNumber}\n")
        append("🔍 Solved: \"${puzzle.headline}\"\n")
        append("⏱️ Time: ${formatTime(timerSeconds)}\n")
        append("🎯 Accuracy: $accuracy%\n")
        append("💡 Hints Used: $hintsUsed\n")
        append("Play Chronicle Cryptogram: $url")
    }

    const val SHARE_URL = "https://jdial1.github.io/Chronicle-Cryptogram/"
}
