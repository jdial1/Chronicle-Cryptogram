package com.chroniclecryptogram.board

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.chroniclecryptogram.cipher.model.CryptogramWord

/**
 * What the board just did, said out loud.
 *
 * Typing one letter fills *every* copy of that glyph at once. That is the game's
 * signature move and the largest visual event on the board, and it had no
 * spoken equivalent on either surface: the tiles are deliberately never focused
 * (the mobile keyboard has to stay down), so their careful contentDescriptions
 * are unreachable and a screen reader heard nothing at all. State has to arrive
 * through a live region instead.
 *
 * The wording is the web board's, to the character -- the two surfaces describe
 * the same move, and a player moving between them should hear the same thing.
 */
internal const val BOARD_WIPED = "Board wiped clean."
internal const val BOARD_DECODED = "Decoded. Every mark on the board is filled."

private fun marks(count: Int) = if (count == 1) "1 mark" else "$count marks"

/**
 * The note for one change of [prior] into [next], or null when there is nothing
 * worth saying.
 *
 * Several glyphs changing at once is a wipe, or progress arriving from storage
 * or the cloud. Only the wipe is the player's own doing, so only the wipe is
 * announced -- otherwise a cloud merge would narrate itself mid-solve.
 */
internal fun boardNote(
    prior: Map<String, String>,
    next: Map<String, String>,
    copies: (String) -> Int,
): String? {
    val touched = (prior.keys + next.keys).filter { prior[it].orEmpty() != next[it].orEmpty() }
    if (touched.isEmpty()) return null
    if (touched.size > 1) {
        return if (touched.all { next[it].isNullOrEmpty() }) BOARD_WIPED else null
    }
    val symbolId = touched.single()
    val marks = marks(copies(symbolId))
    val letter = next[symbolId]
    return if (letter.isNullOrEmpty()) {
        "${prior[symbolId]} cleared from $marks."
    } else {
        "$letter typed onto $marks."
    }
}

/** A note plus the count that forces it to be re-read. See [BoardNote]. */
internal data class BoardNote(val text: String, val seq: Int)

/**
 * Live-region text for the current board.
 *
 * [seq] exists because a live region set to the same string twice is silent --
 * no change, no announcement. In a cryptogram that lands constantly: typing K
 * onto three different single-copy glyphs yields "K typed onto 1 mark." three
 * times, and only the first would ever be heard. The caller keys the announcing
 * node off [seq] so the node is replaced rather than updated in place.
 */
@Composable
internal fun rememberBoardNote(
    words: List<CryptogramWord>,
    mappings: Map<String, String>,
    solved: Boolean,
): BoardNote {
    val copies = remember(words) {
        val counted = HashMap<String, Int>()
        for (word in words) {
            for (cell in word.symbols) {
                if (!cell.isPunctuation) counted[cell.symbolId] = (counted[cell.symbolId] ?: 0) + 1
            }
        }
        counted
    }

    // All keyed on words: a fresh board starts silent and forgets the last one.
    var note by remember(words) { mutableStateOf(BoardNote("", 0)) }
    // Null until this board has been seen once. A board that arrives already
    // solved -- the archive, or restored progress -- was not solved just now,
    // and its filled mappings are not a move the player made.
    val prior = remember(words) { mutableStateOf<Map<String, String>?>(null) }
    val wasSolved = remember(words) { mutableStateOf<Boolean?>(null) }

    LaunchedEffect(words, mappings, solved) {
        val seen = prior.value
        if (seen == null) {
            prior.value = mappings
            wasSolved.value = solved
            return@LaunchedEffect
        }
        if (seen != mappings) {
            prior.value = mappings
            boardNote(seen, mappings) { copies[it] ?: 0 }?.let { note = BoardNote(it, note.seq + 1) }
        }
        // The solve is the one board event that is not just another letter, and
        // it is the payoff the whole edition was for. Said after the fill that
        // caused it, so the player hears the move and then what the move did.
        if (wasSolved.value == false && solved) {
            wasSolved.value = true
            note = BoardNote(BOARD_DECODED, note.seq + 1)
        }
    }

    return note
}
