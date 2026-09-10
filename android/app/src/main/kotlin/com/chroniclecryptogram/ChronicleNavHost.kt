package com.chroniclecryptogram

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue

/**
 * Where the player is.
 *
 * Five top-level destinations, within Material's three-to-five guidance. The
 * leaderboard is not one of them: it is a view of the player's own standing, so
 * it lives inside the Bureau File next to their campaign stats rather than
 * competing for a slot in the bar.
 *
 * A sealed hierarchy and one saved value rather than navigation-compose: nothing
 * takes an argument the board does not already hold, and nothing deep-links, so
 * a nav graph would be more machinery than the app has navigation.
 */
enum class Destination { Board, Archive, CaseFile, Guide, Desk }

/**
 * Holds the current destination and survives configuration changes.
 *
 * Back returns to the board from anywhere else, and is left to the system on the
 * board itself so it closes the app.
 */
class Navigator(initial: Destination = Destination.Board) {
    var current by mutableStateOf(initial)
        private set

    fun go(destination: Destination) {
        current = destination
    }

    fun home() {
        current = Destination.Board
    }
}

@Composable
fun rememberNavigator(): Navigator {
    var saved by rememberSaveable { mutableStateOf(Destination.Board.name) }
    val navigator = androidx.compose.runtime.remember { Navigator(Destination.valueOf(saved)) }
    saved = navigator.current.name

    BackHandler(enabled = navigator.current != Destination.Board) { navigator.home() }
    return navigator
}
