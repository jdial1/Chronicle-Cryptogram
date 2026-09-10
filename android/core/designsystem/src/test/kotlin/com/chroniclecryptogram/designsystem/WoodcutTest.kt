package com.chroniclecryptogram.designsystem

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.File

/**
 * Every puzzle names a press plate in its `silhouette` field. A name with no
 * drawable behind it ships as a blank card rather than a crash, so it needs a
 * test rather than a first playthrough to catch it.
 */
class WoodcutTest {

    private val repoRoot = File("../../..").canonicalFile

    private val silhouettes: List<String> by lazy {
        val text = File(repoRoot, "src/data/puzzles.json").readText()
        Json.parseToJsonElement(text).jsonArray.mapNotNull {
            it.jsonObject["silhouette"]?.jsonPrimitive?.content?.takeIf(String::isNotEmpty)
        }
    }

    private val drawables: Set<String> by lazy {
        File(repoRoot, "android/core/designsystem/src/main/res/drawable")
            .listFiles { f -> f.name.startsWith("woodcut_") && f.extension == "xml" }
            .orEmpty()
            .map { it.nameWithoutExtension }
            .toSet()
    }

    /** GiSecretBook -> woodcut_secret_book, matching scripts/gen-woodcuts.mjs. */
    private fun resourceName(name: String) = "woodcut_" +
        name.removePrefix("Gi")
            .replace(Regex("([a-z0-9])([A-Z])"), "$1_$2")
            .lowercase()

    @Test
    fun `every plate in the registry has a drawable`() {
        assertTrue(Woodcuts.isNotEmpty(), "no plates registered")
        for (name in Woodcuts.keys) {
            assertTrue(
                resourceName(name) in drawables,
                "$name has no drawable (${resourceName(name)}.xml)",
            )
        }
    }

    @Test
    fun `every silhouette a puzzle names is registered`() {
        assertTrue(silhouettes.isNotEmpty(), "no puzzle names a silhouette")
        val missing = silhouettes.distinct().filterNot { it in Woodcuts }
        assertEquals(emptyList<String>(), missing, "puzzles name plates that do not exist")
    }

    @Test
    fun `every generated drawable is registered, so none is dead weight`() {
        val registered = Woodcuts.keys.map(::resourceName).toSet()
        val orphans = drawables - registered
        assertEquals(emptySet<String>(), orphans, "drawables nothing references")
    }

    @Test
    fun `every plate carries an ink`() {
        for ((name, woodcut) in Woodcuts) {
            assertTrue(
                woodcut.ink in PressInk.entries,
                "$name has no press ink",
            )
        }
    }
}
