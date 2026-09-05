package com.chroniclecryptogram.cloud

import android.app.Activity
import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.chroniclecryptogram.data.Account
import com.chroniclecryptogram.data.AccountRepository
import com.chroniclecryptogram.data.NoAccountRepository
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.GetCredentialProviderConfigurationException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/**
 * Firebase Auth, driven by Credential Manager.
 *
 * **Not exercised by an automated test.** Verifying it needs real credentials
 * and a device, and Google sign-in in particular can only be proven on a
 * Play-signed build -- a certificate-hash mismatch fails there and nowhere else.
 * The contract it satisfies is tested against fakes.
 *
 * [webClientId] is the *web* OAuth client, not the Android one. That trips
 * people up every time, and it is what the web build uses too.
 */
class FirebaseAccount(
    private val auth: FirebaseAuth,
    private val webClientId: String,
) : AccountRepository {

    override val account: Flow<Account?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser?.toAccount()) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override suspend fun signInAnonymously(): Result<Account> = runCatching {
        auth.currentUser?.toAccount()
            ?: auth.signInAnonymously().await().user!!.toAccount()
    }

    override suspend fun signInWithGoogle(activity: Any): Result<Account> = runCatching {
        val host = activity as? Activity
            ?: error("Credential Manager needs an Activity to show the chooser.")

        val option = GetGoogleIdOption.Builder()
            .setServerClientId(webClientId)
            // false, so a player with no Google account on the device still sees
            // the chooser rather than a silent failure.
            .setFilterByAuthorizedAccounts(false)
            .build()

        val response = try {
            CredentialManager.create(host as Context)
                .getCredential(
                    host,
                    GetCredentialRequest.Builder().addCredentialOption(option).build(),
                )
        } catch (error: GetCredentialException) {
            throw SignInProblem(explain(error), error)
        }

        val token = GoogleIdTokenCredential.createFrom(response.credential.data).idToken
        val credential = GoogleAuthProvider.getCredential(token, null)

        // Link rather than replace, so anonymous progress carries into the
        // named account instead of being stranded on a uid nobody can reach.
        val current = auth.currentUser
        val result = if (current != null && current.isAnonymous) {
            runCatching { current.linkWithCredential(credential).await() }
                .getOrElse { auth.signInWithCredential(credential).await() }
        } else {
            auth.signInWithCredential(credential).await()
        }
        result.user!!.toAccount()
    }

    override suspend fun signOut() {
        auth.signOut()
    }

    override suspend fun deleteAccount(): Result<Unit> = runCatching {
        // The auth user itself, not only their documents: Play requires the
        // account to go, and the web version only ever deleted the data.
        val user = auth.currentUser ?: return@runCatching
        user.delete().await()
    }
}

/** A sign-in failure with a message worth showing a person. */
class SignInProblem(message: String, cause: Throwable) : Exception(message, cause)

/**
 * Turns a Credential Manager failure into something actionable.
 *
 * The raw messages are written for developers -- "No credentials available" is
 * what a *certificate mismatch* looks like from the outside, which sends people
 * hunting in the wrong place entirely. Google sign-in only works when the exact
 * signing certificate of the installed build is registered with the Firebase
 * project, so a debug build and a Play build each need their own SHA-1.
 */
private fun explain(error: GetCredentialException): String = when (error) {
    is GetCredentialCancellationException -> "Sign-in cancelled."

    is NoCredentialException ->
        "No Google account was offered. Either there is no Google account on " +
            "this device, or this build's signing certificate is not registered " +
            "with the bureau's Firebase project."

    is GetCredentialProviderConfigurationException ->
        "Google Play services is missing or out of date on this device."

    else -> error.message ?: "Sign-in failed."
}

private fun com.google.firebase.auth.FirebaseUser.toAccount() = Account(
    uid = uid,
    displayName = displayName,
    anonymous = isAnonymous,
)

/**
 * Builds the account repository, or the no-op one if Firebase is not on the
 * device or not configured.
 *
 * Lives here so `:app` never names a Firebase type and stays compilable in a
 * build with no credentials.
 */
fun createAccountRepository(webClientId: String): AccountRepository =
    firebaseOrElse(webClientId.isNotEmpty(), NoAccountRepository) {
        FirebaseAccount(FirebaseAuth.getInstance(), webClientId)
    }
