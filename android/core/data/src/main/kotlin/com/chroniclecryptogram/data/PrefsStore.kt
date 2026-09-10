package com.chroniclecryptogram.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

/** Which palette to paint, independent of the per-puzzle Morning/Evening slot. */
enum class ThemeMode { System, Light, Dark }

/**
 * How the player types. The typewriter is the house instrument; the system
 * keyboard is offered for anyone who finds a custom key bank slower or harder
 * to reach, which includes most switch- and gesture-typing users.
 */
enum class KeyboardMode { Typewriter, System }

data class DeskPrefs(
    val themeMode: ThemeMode = ThemeMode.System,
    val keyboardMode: KeyboardMode = KeyboardMode.Typewriter,
    val reduceMotion: Boolean = false,
    /**
     * How the player is named on the board. Empty means they have not chosen
     * one, and nothing is posted until they do -- a time is published under this
     * name, so it is never picked for them.
     */
    val codename: String = "",
    val titleBadge: String = "",
    val countryCode: String = "US",
) {
    /** A board posting needs a name; everything else has a default. */
    val canPost: Boolean get() = codename.isNotBlank()

    /**
     * The limits the board enforces, applied on the way to storage.
     *
     * They used to sit one per setter, which meant they were only applied by
     * whoever remembered to call the right one. Here there is one door.
     */
    fun clipped() = copy(
        codename = Posting.clipCodename(codename),
        titleBadge = titleBadge.take(60),
        countryCode = countryCode.uppercase().take(2),
    )
}

/**
 * Small, independent settings.
 *
 * Preferences DataStore rather than the [DeskStore] proto: these are scalars a
 * user toggles, they have no merge semantics, and keeping them separate means a
 * settings write never rewrites the whole save file.
 *
 * One [update] rather than a setter per preference, which is the shape
 * [DeskStore] already uses. The setters were the same three lines six times, and
 * each one had to be named again in an interface, again in a screen's parameter
 * list, again where the screen was wired up and again in that screen's test --
 * five places to touch to add a seventh preference, and the interface had one
 * implementation and no fakes to justify it.
 *
 * Clamping lives in [DeskPrefs.clipped] instead of in the setters, so a value
 * cannot reach the file unclamped by going through a different door.
 */
class DeskPrefsStore(private val store: DataStore<Preferences>) {

    val prefs: Flow<DeskPrefs> = store.data
        // A read failure must not take the app down; defaults are always safe.
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { it.toDeskPrefs() }

    suspend fun update(transform: (DeskPrefs) -> DeskPrefs) {
        store.edit { values ->
            val next = transform(values.toDeskPrefs()).clipped()
            values[ThemeKey] = next.themeMode.name
            values[KeyboardKey] = next.keyboardMode.name
            values[ReduceMotionKey] = next.reduceMotion
            values[CodenameKey] = next.codename
            values[TitleBadgeKey] = next.titleBadge
            values[CountryKey] = next.countryCode
        }
    }

    private fun Preferences.toDeskPrefs() = DeskPrefs(
        themeMode = this[ThemeKey]?.toThemeMode() ?: ThemeMode.System,
        keyboardMode = this[KeyboardKey]?.toKeyboardMode() ?: KeyboardMode.Typewriter,
        reduceMotion = this[ReduceMotionKey] ?: false,
        codename = this[CodenameKey].orEmpty(),
        titleBadge = this[TitleBadgeKey] ?: TitleBadges.last(),
        countryCode = this[CountryKey] ?: "US",
    )

    companion object {
        private val ThemeKey = stringPreferencesKey("themeMode")
        private val KeyboardKey = stringPreferencesKey("keyboardMode")
        private val ReduceMotionKey = booleanPreferencesKey("reduceMotion")
        private val CodenameKey = stringPreferencesKey("codename")
        private val TitleBadgeKey = stringPreferencesKey("titleBadge")
        private val CountryKey = stringPreferencesKey("countryCode")

        /** An unrecognised stored value falls back rather than throwing. */
        private fun String.toThemeMode() =
            ThemeMode.entries.firstOrNull { it.name == this }

        private fun String.toKeyboardMode() =
            KeyboardMode.entries.firstOrNull { it.name == this }

        fun create(context: Context): DeskPrefsStore = DeskPrefsStore(
            PreferenceDataStoreFactory.create {
                context.preferencesDataStoreFile("desk-prefs")
            }
        )
    }
}
