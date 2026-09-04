package com.chroniclecryptogram.leaderboard

import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import com.chroniclecryptogram.data.LeaderboardEntry
import com.chroniclecryptogram.data.Standings
import com.chroniclecryptogram.designsystem.theme.ChronicleTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The board renders against a fake standing, so its behaviour is testable
 * without Firestore -- which is the reason [com.chroniclecryptogram.data.Leaderboard]
 * is an interface at all.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w411dp-h891dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LeaderboardScreenTest {

    @get:Rule
    val compose = createComposeRule()

    private fun entry(uid: String, time: Int, hints: Int = 0) = LeaderboardEntry(
        uid = uid,
        codename = uid.uppercase(),
        timeSeconds = time,
        accuracy = 100,
        hintsUsed = hints,
        postedAt = 0,
    )

    private fun show(state: BoardState, playerUid: String? = null) {
        compose.setContent {
            ChronicleTheme(dark = false) {
                LeaderboardScreen(state = state, playerUid = playerUid)
            }
        }
    }

    @Test
    fun `a loading board says so`() {
        show(BoardState.Loading)
        compose.onNodeWithText("Reading the wire…").assertExists()
    }

    @Test
    fun `an offline board explains itself rather than showing nothing`() {
        show(BoardState.Offline)
        compose.onNodeWithText(
            "The wire is down. Times post when the connection returns.",
        ).assertExists()
    }

    @Test
    fun `an empty board says no times are filed`() {
        show(BoardState.Ready(Standings.rank(emptyList(), null)))
        compose.onNodeWithText("No times filed for this edition yet.").assertExists()
    }

    @Test
    fun `entries are listed fastest first with their rank`() {
        val standing = Standings.rank(
            listOf(entry("c", 300), entry("a", 100), entry("b", 200)),
            uid = null,
        )
        show(BoardState.Ready(standing))

        compose.onNodeWithContentDescription("Rank 1, A, 01:40.0, 0 hints").assertExists()
        compose.onNodeWithContentDescription("Rank 2, B, 03:20.0, 0 hints").assertExists()
        compose.onNodeWithContentDescription("Rank 3, C, 05:00.0, 0 hints").assertExists()
    }

    @Test
    fun `the player's own row is marked`() {
        val standing = Standings.rank(
            listOf(entry("a", 100), entry("me", 200)),
            uid = "me",
        )
        show(BoardState.Ready(standing), playerUid = "me")

        compose.onNodeWithContentDescription("Rank 2, ME, 03:20.0, 0 hints, your time").assertExists()
    }

    /**
     * The board cannot verify a time -- they are client-asserted and the rules
     * only range-check them. The web shipped "Verified!" and "Certified" copy,
     * which was a false claim in a paid app; it must not come back here.
     */
    @Test
    fun `nothing on the board claims a time is verified`() {
        val standing = Standings.rank(listOf(entry("a", 100)), uid = null)
        show(BoardState.Ready(standing))

        compose.onNodeWithText("Times as filed by solvers.").assertExists()
        compose.onNodeWithText("Verified", substring = true).assertDoesNotExist()
        compose.onNodeWithText("Certified", substring = true).assertDoesNotExist()
        compose.onNodeWithText("certified", substring = true).assertDoesNotExist()
    }
}
