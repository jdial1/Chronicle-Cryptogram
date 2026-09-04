package com.chroniclecryptogram.leaderboard

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
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

    /**
     * The board's real home is inside the Bureau's LazyColumn, which measures
     * its children with an unbounded height. A vertical scroller there throws,
     * and a weight(1f) there collapses to nothing -- both of which this screen
     * did until the rows were flattened. Rendering it in that exact shape is the
     * only way the test catches either.
     */
    @Test
    fun `the board renders inside a scrolling parent`() {
        val entries = (1..30).map { entry("uid-$it", time = 60 + it) }
        compose.setContent {
            ChronicleTheme(dark = false) {
                LazyColumn(Modifier.fillMaxSize()) {
                    item {
                        LeaderboardScreen(
                            state = BoardState.Ready(Standings.rank(entries, "uid-3")),
                            playerUid = "uid-3",
                        )
                    }
                }
            }
        }

        compose.onNodeWithText("UID-1").assertExists()
        // Capped, with the remainder summarised rather than silently dropped.
        compose.onNodeWithText("and 5 more.").assertExists()
        compose.onNodeWithText("You stand 3 of 30.").assertExists()
    }

    @Test
    fun `an empty board says so inside a scrolling parent`() {
        compose.setContent {
            ChronicleTheme(dark = false) {
                LazyColumn(Modifier.fillMaxSize()) {
                    item {
                        LeaderboardScreen(
                            state = BoardState.Ready(Standings.rank(emptyList(), null)),
                            playerUid = null,
                        )
                    }
                }
            }
        }
        compose.onNodeWithText("No times filed for this edition yet.").assertExists()
    }

    @Test
    fun `a failed posting is reported on the board`() {
        compose.setContent {
            ChronicleTheme(dark = false) {
                LeaderboardScreen(
                    state = BoardState.Ready(Standings.rank(emptyList(), null)),
                    playerUid = null,
                    note = "Choose a codename before posting a time.",
                )
            }
        }
        compose.onNodeWithText("Choose a codename before posting a time.").assertExists()
    }
}
