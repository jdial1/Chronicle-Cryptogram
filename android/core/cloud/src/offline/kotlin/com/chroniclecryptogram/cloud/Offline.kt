package com.chroniclecryptogram.cloud

import com.chroniclecryptogram.data.AccountRepository
import com.chroniclecryptogram.data.CloudDesk
import com.chroniclecryptogram.data.Leaderboard
import com.chroniclecryptogram.data.NoAccountRepository
import com.chroniclecryptogram.data.NoCloudDesk
import com.chroniclecryptogram.data.NoLeaderboard
import com.chroniclecryptogram.data.NoPuzzleStats
import com.chroniclecryptogram.data.PuzzleStatsRepository

/**
 * The cloud module with no cloud in it.
 *
 * `:core:cloud` has two source sets and compiles exactly one: `src/firebase`
 * when the build has credentials and `chronicleCloud=true`, this one otherwise.
 * They present the same five functions, so `:app` is written once and neither
 * knows which it got.
 *
 * A flag alone would not have been enough. The Firebase AARs were declared
 * unconditionally, so switching the feature off still shipped them -- and with
 * them `USE_BIOMETRIC` and `USE_FINGERPRINT` on the listing of an offline word
 * game, plus a `FirebaseInitProvider` that registers an installation id before
 * the player touches anything, which no honest Data Safety form could then call
 * "no data collected". Removing the code is what removes those; a build that
 * merely does not call it does not.
 *
 * Every return here is a real object from `:core:data`, not a throw: the game
 * was designed to run without an account, so there is nothing to degrade.
 */
@Suppress("UNUSED_PARAMETER")
fun createAccountRepository(webClientId: String): AccountRepository = NoAccountRepository

@Suppress("UNUSED_PARAMETER")
fun createCloudDesk(configured: Boolean): CloudDesk = NoCloudDesk

@Suppress("UNUSED_PARAMETER")
fun createLeaderboard(configured: Boolean): Leaderboard = NoLeaderboard

@Suppress("UNUSED_PARAMETER")
fun createPuzzleStats(configured: Boolean): PuzzleStatsRepository = NoPuzzleStats

/**
 * Crash reporting is Play Console's Android Vitals in this build.
 *
 * Vitals gives deobfuscated crash and ANR stacks for free on a Play-signed
 * bundle -- the mapping file uploads with it -- so switching Crashlytics off
 * costs the stacks nothing and costs the listing two permissions.
 */
@Suppress("UNUSED_PARAMETER")
fun setCrashReporting(enabled: Boolean) = Unit
