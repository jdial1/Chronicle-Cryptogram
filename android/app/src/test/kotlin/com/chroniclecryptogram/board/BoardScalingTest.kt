package com.chroniclecryptogram.board

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.chroniclecryptogram.cipher.CipherEngine
import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The claim this rewrite exists to make good on: the board sizes itself from
 * measured text, so Android's font-scale setting enlarges tiles instead of
 * clipping their contents.
 *
 * The web board cannot pass this. It sets `--tile-h: 4rem`, and `rem` ignores the
 * platform font scale entirely -- which is precisely why it needed an in-app
 * A-/A+ zoom control to compensate.
 *
 * Runs under Robolectric on the JVM, so it gates every build rather than only
 * the runs someone remembers to do on a device.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
// Real Skia text layout. Robolectric's legacy graphics stubs font metrics, so
// sp -> px never changes and the whole point of this test evaporates.
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BoardScalingTest {

    @get:Rule
    val compose = createComposeRule()

    private companion object {
        const val BOARD_WIDTH_DP = 360
    }

    private val words: List<CryptogramWord> = run {
        val text = "THE VANCE ESTATE KEEPS ITS SECRETS."
        val alphabet = CipherEngine.buildCipherAlphabet("board-scaling-test$text", homophonic = false)
        CipherEngine.parseCryptogramText(text, alphabet)
    }

    private val placed = LinkedHashMap<String, Rect>()
    private var fontScale by mutableFloatStateOf(1f)

    /**
     * One composition for the whole test; font scale is state so the board
     * recomposes rather than being rebuilt. `setContent` may only be called once
     * per test.
     */
    @Before
    fun setUp() {
        compose.setContent {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalDensity provides Density(base.density, fontScale)
            ) {
                ChronicleTheme(dark = false) {
                    Box(Modifier.width(BOARD_WIDTH_DP.dp)) {
                        CipherBoard(
                            words = words,
                            mappings = emptyMap(),
                            selectedCellId = null,
                            lockedSymbolIds = emptySet(),
                            flaggedSymbolIds = emptySet(),
                            onCellClick = { _, _ -> },
                            modifier = Modifier.fillMaxWidth(),
                            onTilePlaced = { cellId, bounds -> placed[cellId] = bounds },
                        )
                    }
                }
            }
        }
    }

    /**
     * Re-lays out at [scale] and returns where every tile landed.
     *
     * The map is not cleared first: onTilePlaced only fires when a layout pass
     * actually runs, so clearing would empty it whenever [scale] already matches
     * the current one -- including the very first read after composition. Cell
     * ids are stable, so every entry is overwritten anyway.
     */
    private fun tileBounds(scale: Float): Map<String, Rect> {
        compose.runOnUiThread { fontScale = scale }
        compose.waitForIdle()
        return LinkedHashMap(placed)
    }

    @Test
    fun `tiles grow with the system font scale`() {
        val h1 = tileBounds(1.0f).values.first().height
        val h13 = tileBounds(1.3f).values.first().height
        val h2 = tileBounds(2.0f).values.first().height

        assertTrue("fontScale 1.3 did not grow the tile ($h1 -> $h13)", h13 > h1)
        assertTrue("fontScale 2.0 did not grow the tile ($h13 -> $h2)", h2 > h13)
    }

    @Test
    fun `every tile is placed at every font scale`() {
        val expected = words.sumOf { it.symbols.size }
        for (scale in listOf(1.0f, 1.3f, 2.0f)) {
            assertEquals("tile count changed at fontScale $scale", expected, tileBounds(scale).size)
        }
    }

    /**
     * No tile may overhang the board. This is the clipping check: at fontScale
     * 2.0 a fixed-size board would either cut glyphs off or run off the edge.
     */
    @Test
    fun `no tile overflows the board width at any font scale`() {
        for (scale in listOf(1.0f, 1.3f, 2.0f)) {
            val bounds = tileBounds(scale)
            assertTrue("no tiles placed at fontScale $scale", bounds.isNotEmpty())
            val maxRight = bounds.values.maxOf { it.right }
            assertTrue(
                "a tile overflowed at fontScale $scale: right=$maxRight limit=$BOARD_WIDTH_DP",
                maxRight <= BOARD_WIDTH_DP + 0.5f,
            )
        }
    }

    /** Tiles must not overlap: a wrapped word starts a new line, it does not stack. */
    @Test
    fun `tiles never overlap at the largest font scale`() {
        val bounds = tileBounds(2.0f).values.toList()
        assertTrue("no tiles placed", bounds.isNotEmpty())
        for (i in bounds.indices) {
            for (j in i + 1 until bounds.size) {
                val a = bounds[i]
                val b = bounds[j]
                val overlaps = a.left < b.right && b.left < a.right &&
                    a.top < b.bottom && b.top < a.bottom
                assertTrue("tiles $i and $j overlap: $a vs $b", !overlaps)
            }
        }
    }
}
