package com.chroniclecryptogram

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.File

/**
 * The Bureau prints; it does not certify (docs/VOICE.md). `LeaderboardScreenTest`
 * pins that on the board, but the web's clipping screen shipped "CERTIFIED" and
 * "OFFICIALLY DECRYPTED" past a guard that only watched one file. This judges the
 * copy in every screen of the app, the way `src/components/voice.test.ts` does on
 * the web.
 *
 * Only string literals count, with comments stripped: `verifiedSymbolIds` is code,
 * not a claim made to the player.
 */
class VoiceCopyTest {

    private val sources = File("src/main/kotlin").walkTopDown().filter { it.extension == "kt" }.toList()

    private fun literals(source: String): List<String> {
        val code = source
            .replace(Regex("/\\*[\\s\\S]*?\\*/"), "")
            .replace(Regex("(?m)^\\s*//.*$"), "")
        return Regex("\"((?:\\\\.|[^\"\\\\\\n])*)\"").findAll(code).map { it.groupValues[1] }.toList()
    }

    @Test
    fun `finds the screens it is meant to judge`() {
        assertTrue(sources.any { it.name == "LeaderboardScreen.kt" }, "ran from the wrong directory")
    }

    @Test
    fun `no screen claims the Bureau verified, certified or made anything official`() {
        val claims = sources.flatMap { file ->
            literals(file.readText())
                .filter { Regex("verif|certif|official", RegexOption.IGNORE_CASE).containsMatchIn(it) }
                .map { "${file.name}: $it" }
        }
        assertEquals(emptyList<String>(), claims)
    }
}
