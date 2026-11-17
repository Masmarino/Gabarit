package com.masmarino.gabarit

import org.junit.Assert.assertEquals
import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The tone the library computes is tools/tokens.py's, for every ambiance of tokens/gabarit.json. */
class GGroundTest {
    private val expected = mapOf(
        "light" to GGroundTones.light, "dark" to GGroundTones.dark, "black" to GGroundTones.black,
        "aurore" to GGroundTones.aurore, "lagune" to GGroundTones.lagune, "braise" to GGroundTones.braise,
        "nuitPolaire" to GGroundTones.nuitPolaire, "sousBois" to GGroundTones.sousBois, "laiton" to GGroundTones.laiton,
        "givre" to GGroundTones.givre, "dore" to GGroundTones.dore,
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

    /** 4.2: the accent the library computes is tools/tokens.py's (`accent_tone()`), to a byte. */
    @Test
    fun accentsMatchTheGenerator() {
        val generated = mapOf("dore" to GAccentTones.dore)
        for (ground in GGrounds.all) {
            val want = generated[ground.name]
            if (want == null) {
                assertNull(ground.name, ground.accentTone())
                continue
            }
            assertAccent(ground.name, ground.accentTone()!!, want.accentText, want.onAccent, want.selected)
            assertEquals(ground.name, want.accent, ground.accentTone()!!.accent)
        }
    }

    /** The rule's reference values (the 4.2 brief): other accents, on other grounds. */
    @Test
    fun accentsOnOtherGrounds() {
        fun on(ground: GGroundSpec, accent: Long) = ground.copy(accent = Color(accent)).accentTone()!!
        assertAccent("dore pale", on(GGrounds.dore, 0xFFE9C979), Color(0xFFE9C979), Color(0xFF10151C), 0.16f)
        assertAccent("dore dark", on(GGrounds.dore, 0xFF7A5A20), Color(0xFFD7CEBC), Color(0xFFFFFFFF), 0.16f)
        assertAccent("givre", on(GGrounds.givre, 0xFFB8862B), Color(0xFF7D5E26), Color(0xFF10151C), 0.1f)
        assertAccent("aurore", on(GGrounds.aurore, 0xFFE9C979), Color(0xFFF2DFAF), Color(0xFF10151C), 0.16f)
        assertAccent("light", on(GGrounds.light, 0xFF2F6FDB), Color(0xFF2A62BE), Color(0xFF10151C), 0.1f)
    }

    private fun assertAccent(name: String, tone: GAccentTone, text: Color, on: Color, selected: Float) {
        val byte = 1f / 255 + 1e-4f
        for ((what, got, want) in listOf(Triple("text", tone.accentText, text), Triple("on", tone.onAccent, on))) {
            assertEquals("$name $what red", want.red, got.red, byte)
            assertEquals("$name $what green", want.green, got.green, byte)
            assertEquals("$name $what blue", want.blue, got.blue, byte)
        }
        assertEquals("$name selected", selected, tone.selected, 1e-6f)
    }

    @Test
    fun theMotionReadsTheTokens() {
        assertEquals(450, GMotion.millis["ground"])
        assertEquals(250, GMotion.millis["smooth"])
        assertTrue(GMotion.pageRise > 0f)
    }
}
