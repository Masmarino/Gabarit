package com.masmarino.gabarit

import org.junit.Assert.assertTrue
import org.junit.Test

/** 4.1: the text on a tinted glass (the prominent button, the chosen chip) holds 4.5:1 at the glass's worst point, on every ground. */
class GControlGlassTest {
    @Test fun textOnTintedGlassHolds() {
        for (ground in GGrounds.all) {
            val colors = if (ground.mode == GGroundMode.LIGHT) GLightColors else GDarkColors
            val liquid = gToneOf(ground).liquid
            for ((name, color) in listOf("accent" to colors.accent, "primary" to colors.primary)) {
                val tint = gProminent(color)
                val text = ground.inkOnTint(tint, liquid)
                val worst = ground.tintPoints(tint, liquid).minOf { GLuminance.contrast(GLuminance.rgb(it), GLuminance.rgb(text)) }
                assertTrue("${ground.name} $name: $worst", worst >= GGlassValues.textMinimum)
            }
        }
    }
}
