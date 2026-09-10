package com.chroniclecryptogram.designsystem

import java.awt.Font
import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The bundled cipher font must cover all 54 glyphs.
 *
 * This is the check that stops the board falling back to the device's Noto
 * chain, where coverage varies by OEM and Android version and a miss renders as
 * tofu. It runs on the JVM via `java.awt.Font`, so it gates every build rather
 * than only the ones someone remembers to run on a device.
 *
 * A device test is still worth having eventually -- this proves the codepoints
 * are present, not that they look right next to Special Elite.
 */
class GlyphCoverageTest {

    private val repoRoot = File("../../..").canonicalFile

    private val palette by lazy {
        val file = File(
            repoRoot,
            "android/core/cipher/src/test/resources/fixtures/palette.json",
        )
        assertTrue(file.isFile, "palette fixture not found at $file")
        Json.parseToJsonElement(file.readText()).jsonObject["symbols"]!!.jsonArray
            .map { it.jsonObject["glyph"]!!.jsonPrimitive.content }
    }

    private fun font(name: String): Font {
        val file = File(repoRoot, "android/core/designsystem/src/main/res/font/$name")
        assertTrue(file.isFile, "font not found at $file -- run node scripts/gen-glyph-font.mjs")
        return Font.createFont(Font.TRUETYPE_FONT, file)
    }

    @Test
    fun `the cipher font covers every glyph in the palette`() {
        val cipherFont = font("chronicle_glyphs.ttf")
        val missing = palette.filter { cipherFont.canDisplayUpTo(it) != -1 }
        assertEquals(emptyList<String>(), missing, "chronicle_glyphs.ttf is missing glyphs")
        assertEquals(54, palette.size, "palette size changed -- regenerate the font")
    }

    /**
     * Documents why the cipher font has to exist at all. If a display face ever
     * did cover the palette this would fail, and the extra font could go.
     */
    @Test
    fun `the display faces do not cover the palette, which is why the cipher font exists`() {
        val display = font("special_elite_400.ttf")
        val uncovered = palette.count { display.canDisplayUpTo(it) != -1 }
        assertTrue(
            uncovered > 0,
            "Special Elite now covers the whole palette; chronicle_glyphs.ttf may be redundant",
        )
    }

    @Test
    fun `every bundled face loads`() {
        for (face in bundledFaces()) {
            Font.createFont(Font.TRUETYPE_FONT, face)
        }
    }

    /**
     * Nothing is bundled that no type is set in.
     *
     * A face named in `Type.kt` cannot be stripped by resource shrinking, so an
     * unused family is dead weight in every APK -- four of them were, for about
     * 195KB, and the previous version of this test could not tell because it
     * asserted a face *count*. A count goes stale the moment the design changes;
     * this compares what is on disk against what the code actually names.
     */
    @Test
    fun `no face is bundled that nothing draws with`() {
        val declared = File(repoRoot, "android/core/designsystem/src/main/kotlin")
            .walkTopDown()
            .filter { it.name == "Type.kt" }
            .flatMap { Regex("""R\.font\.(\w+)""").findAll(it.readText()) }
            .map { it.groupValues[1] }
            .toSet()

        val bundled = bundledFaces().map { it.nameWithoutExtension }.toSet()

        assertEquals(emptySet<String>(), bundled - declared, "bundled but never named")
        assertEquals(emptySet<String>(), declared - bundled, "named but not bundled")
    }

    private fun bundledFaces(): List<File> =
        File(repoRoot, "android/core/designsystem/src/main/res/font")
            .listFiles { f -> f.extension == "ttf" }
            .orEmpty()
            .toList()
}
