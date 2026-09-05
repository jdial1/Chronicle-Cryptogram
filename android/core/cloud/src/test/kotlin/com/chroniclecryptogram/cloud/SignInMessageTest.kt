package com.chroniclecryptogram.cloud

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * The first test in `:core:cloud`, which had none.
 *
 * Nothing here touches Firebase: this is the pure half of the sign-in error
 * path, and the part a player actually reads. Play services hands back its own
 * status text -- "[28444] Developer console is not set up correctly." -- which
 * is accurate, actionable, and addressed to whoever set the project up. It was
 * being printed straight onto the account card.
 */
class SignInMessageTest {

    @Test
    fun `a console misconfiguration is recognised by its status code`() {
        assertTrue(isConfigurationFailure("[28444] Developer console is not set up correctly."))
        assertTrue(isConfigurationFailure("[10] DEVELOPER_ERROR"))
    }

    @Test
    fun `it is recognised by its wording too, in case the code is absent`() {
        assertTrue(isConfigurationFailure("Developer console is not set up correctly"))
        assertTrue(isConfigurationFailure("The project is not set up correctly"))
    }

    @Test
    fun `an ordinary failure is not mistaken for one`() {
        assertFalse(isConfigurationFailure("Network error"))
        assertFalse(isConfigurationFailure("User cancelled the flow"))
        assertFalse(isConfigurationFailure(""))
    }

    @Test
    fun `a status code inside other digits does not match`() {
        // "[128444]" is not 28444; matching on the brackets keeps it exact.
        assertFalse(isConfigurationFailure("[128444] something else"))
    }
}
