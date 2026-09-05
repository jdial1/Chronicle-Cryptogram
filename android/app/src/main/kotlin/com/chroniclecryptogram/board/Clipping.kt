package com.chroniclecryptogram.board

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.core.content.FileProvider
import androidx.core.graphics.createBitmap
import androidx.core.graphics.toColorInt
import androidx.core.graphics.withSave
import androidx.core.content.res.ResourcesCompat
import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.designsystem.R as DesignR
import com.chroniclecryptogram.cipher.model.PuzzleData
import java.io.File

/**
 * The solve, drawn as a newspaper clipping to share.
 *
 * The web renders one in the DOM and the player screenshots it; Android can hand
 * the real image to the share sheet, so it does. Drawn on a plain [Canvas]
 * rather than by capturing the screen: a screenshot would carry whatever the
 * board looked like -- the keyboard, the dock, a half-typed word -- and the
 * clipping is a composed thing, not a snapshot.
 *
 * The figures come from the same [com.chroniclecryptogram.cipher.Solve] helpers
 * the share text uses, so the picture and the words can never disagree.
 */
object Clipping {

    private const val WIDTH = 1080
    private const val MARGIN = 72f

    private val Paper = "#FBF7EE".toColorInt()
    private val Ink = "#1C1A17".toColorInt()
    private val Brass = "#8A6D2F".toColorInt()
    private val Cinnabar = "#A6321E".toColorInt()

    /**
     * Renders the clipping.
     *
     * Height is measured from the laid-out text rather than assumed, so a long
     * quote is never clipped and a short one leaves no dead paper.
     */
    fun render(
        context: Context,
        puzzle: PuzzleData,
        time: String,
        accuracy: Int,
        hintsUsed: Int,
    ): Bitmap {
        val masthead = font(context, DesignR.font.playfair_display_700) ?: Typeface.SERIF
        val body = font(context, DesignR.font.newsreader_400) ?: Typeface.SERIF
        val typewriter = font(context, DesignR.font.special_elite_400) ?: Typeface.MONOSPACE

        val contentWidth = (WIDTH - MARGIN * 2).toInt()

        val kicker = layout(
            text = Edition.editionLabel(puzzle.editionNumber).uppercase(),
            width = contentWidth,
            paint = textPaint(typewriter, 34f, Brass, letterSpacing = 0.14f),
        )
        val headline = layout(
            text = puzzle.headline,
            width = contentWidth,
            paint = textPaint(masthead, 78f, Ink),
        )
        val quote = layout(
            text = "“${puzzle.originalText}”",
            width = contentWidth,
            paint = textPaint(body, 42f, Ink),
            lineSpacing = 1.25f,
        )
        val figures = layout(
            text = "TIME $time   ACCURACY $accuracy%   HINTS $hintsUsed",
            width = contentWidth,
            paint = textPaint(typewriter, 34f, Ink, letterSpacing = 0.08f),
        )
        val footer = layout(
            text = "CHRONICLE CRYPTOGRAM",
            width = contentWidth,
            paint = textPaint(typewriter, 28f, Brass, letterSpacing = 0.2f),
        )

        val gap = 34f
        val height = (
            MARGIN + kicker.height + gap + headline.height + gap * 1.4f +
                quote.height + gap * 1.4f + figures.height + gap + footer.height + MARGIN
            ).toInt()

        val bitmap = createBitmap(WIDTH, height)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Paper)

        val rule = Paint().apply {
            isAntiAlias = true
            color = Ink
        }

        var y = MARGIN
        y = canvas.draw(kicker, y)
        y += gap * 0.4f

        // The masthead rule, and the cinnabar tab that marks the edition.
        canvas.drawRect(MARGIN, y, WIDTH - MARGIN, y + 4f, rule)
        rule.color = Cinnabar
        canvas.drawRect(MARGIN, y, MARGIN + 120f, y + 4f, rule)
        rule.color = Ink
        y += gap

        y = canvas.draw(headline, y)
        y += gap * 1.4f
        y = canvas.draw(quote, y)
        y += gap * 1.4f
        y = canvas.draw(figures, y)
        y += gap * 0.6f

        canvas.drawRect(MARGIN, y, WIDTH - MARGIN, y + 2f, rule)
        y += gap * 0.6f
        canvas.draw(footer, y)

        return bitmap
    }

    /**
     * Writes the clipping where the share sheet can read it.
     *
     * A `content://` URI through [FileProvider], not a `file://` one: since API
     * 24 a file URI handed to another app throws, and the receiving app has no
     * permission to the cache directory either way.
     */
    fun share(context: Context, bitmap: Bitmap): android.net.Uri {
        val dir = File(context.cacheDir, "clippings").apply { mkdirs() }
        // One fixed name: the clipping is transient, and keeping every share
        // would grow the cache directory without limit.
        val file = File(dir, "solve.png")
        file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        return FileProvider.getUriForFile(context, "${context.packageName}.clippings", file)
    }

    private fun Canvas.draw(layout: StaticLayout, top: Float): Float {
        // withSave rather than save/restore by hand: a throw between the two
        // would leave the canvas translated for every later draw.
        withSave {
            translate(MARGIN, top)
            layout.draw(this)
        }
        return top + layout.height
    }

    private fun textPaint(
        typeface: Typeface,
        size: Float,
        color: Int,
        letterSpacing: Float = 0f,
    ) = TextPaint().apply {
        isAntiAlias = true
        this.typeface = typeface
        textSize = size
        this.color = color
        this.letterSpacing = letterSpacing
    }

    private fun layout(
        text: String,
        width: Int,
        paint: TextPaint,
        lineSpacing: Float = 1f,
    ): StaticLayout =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, width)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, lineSpacing)
            .setIncludePad(false)
            .build()

    /** A bundled face, or null so the caller falls back rather than crashing. */
    private fun font(context: Context, id: Int): Typeface? =
        runCatching { ResourcesCompat.getFont(context, id) }.getOrNull()
}
