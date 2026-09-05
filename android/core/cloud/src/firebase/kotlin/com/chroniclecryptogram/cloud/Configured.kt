package com.chroniclecryptogram.cloud

/**
 * Builds a Firebase-backed thing, or falls back when Firebase is not there.
 *
 * Three factories were written out longhand and were the same function apart
 * from their types: check the flag, construct, and fall back on any throwable
 * rather than letting a missing `google-services.json` take the app down at
 * launch. The `catch` is deliberately on `Throwable` -- Firebase initialisation
 * fails with errors, not only exceptions, when the config is absent.
 *
 * Keeping this in `:core:cloud` is what lets `:app` stay free of Firebase types
 * and compile in a build with no credentials at all.
 */
internal inline fun <T> firebaseOrElse(configured: Boolean, fallback: T, make: () -> T): T =
    if (!configured) fallback else try {
        make()
    } catch (error: Throwable) {
        fallback
    }
