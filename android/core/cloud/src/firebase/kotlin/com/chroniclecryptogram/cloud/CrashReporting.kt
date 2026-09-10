package com.chroniclecryptogram.cloud

import com.google.firebase.crashlytics.FirebaseCrashlytics

/**
 * Crash reporting, behind a function so `:app` never names a Firebase type.
 *
 * The native path shipped with none, which the release plan flags: a crash on a
 * player's device was simply invisible. Collection follows whether the build has
 * credentials at all -- a Firebase-less build reports nowhere, so enabling it
 * would only throw.
 *
 * Nothing identifying is attached. The uid is deliberately *not* set as the
 * Crashlytics user id: it would tie a crash report to a player's account and
 * their posted times, and no crash here needs to know who hit it.
 */
fun setCrashReporting(enabled: Boolean) {
    runCatching {
        FirebaseCrashlytics.getInstance().isCrashlyticsCollectionEnabled = enabled
    }
}
