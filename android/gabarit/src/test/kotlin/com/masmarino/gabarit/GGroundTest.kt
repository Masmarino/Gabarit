package com.masmarino.gabarit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The tone the library computes is tools/tokens.py's, for every ambiance of tokens/gabarit.json. */
class GGroundTest {
    private val expected = mapOf(
        "light" to GGroundTones.light, "dark" to GGroundTones.dark, "black" to GGroundTones.black,
        "aurore" to GGroundTones.aurore, "lagune" to GGroundTones.lagune, "braise" to GGroundTones.braise,
        "nuitPolaire" to GGroundTones.nuitPolaire, "sousBois" to GGroundTones.sousBois, "laiton" to GGroundTones.laiton,
        "givre" to GGroundTones.givre,
    )

    @Test
    fun tonesMatchTheGenerator() {
        assertEquals(expected.size, GGrounds.all.size)
        for (ground in GGrounds.all) {
            val tone = assertNotNull(ground.name, ground.tone()).let { ground.tone()!! }
            val want = expected.getValue(ground.name)
            assertEquals("${ground.name}: veil", want.veil, tone.veil, 1e-6f)
            assertEquals("${ground.name}: ink2", want.ink2, tone.ink2, 1e-6f)
            assertEquals("${ground.name}: ink3", want.ink3, tone.ink3, 1e-6f)
            assertEquals("${ground.name}: liquid", want.liquid, tone.liquid, 1e-6f)
            assertEquals("${ground.name}: shade", want.shade.red, tone.shade.red, 1e-3f)
        }
    }

    @Test
    fun theMotionReadsTheTokens() {
        assertEquals(450, GMotion.millis["ground"])
        assertEquals(250, GMotion.millis["smooth"])
        assertTrue(GMotion.pageRise > 0f)
    }
}
