package com.masmarino.gabarit

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
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

    /**
     * 4.1.1, the glass's edge: in a light surface, the dark half does the work and stands out, 1.3:1 at least at the
     * worst point, against the surface: a chip's bottom edge (the ink at `floatBottom` over its thin lens) and a field's
     * shade under its top edge (the ink at `hollowShade` over its hollow). Each ground stop (under its light or not,
     * under its veil), the thin, regular and thick glass on it, dense with reduced transparency; light and givre.
     */
    @Test fun nestedEdgeStandsOut() {
        for (ground in GGrounds.all.filter { it.kind == GGlassKind.LIGHT }) {
            val tone = gToneOf(ground)
            val k = ground.kind.values
            val pages = ground.stops.flatMap { listOf(it, ground.light.color.copy(alpha = ground.light.strength.coerceIn(0f, 1f)).compositeOver(it)) }
                .map { ground.glass.copy(alpha = tone.veil).compositeOver(it) }
            val surfaces = pages.flatMap { page -> listOf(k.thin, k.regular, k.thick).map { ground.glass.copy(alpha = it).compositeOver(page) } } +
                ground.glass.copy(alpha = GGlassValues.reduced).compositeOver(ground.middle)
            fun contrast(a: Color, b: Color) = GLuminance.contrast(GLuminance.rgb(a), GLuminance.rgb(b))
            val chip = surfaces.minOf { surface ->
                val lens = Color.White.copy(alpha = tone.liquid * 0.6f).compositeOver(surface)
                contrast(tone.ink.copy(alpha = GNestedValues.floatBottom).compositeOver(lens), surface)
            }
            val hollow = surfaces.minOf { surface ->
                val inside = tone.shade.copy(alpha = k.hollow * 0.4f).compositeOver(ground.glass.copy(alpha = k.thin).compositeOver(surface))
                contrast(tone.ink.copy(alpha = GNestedValues.hollowShade).compositeOver(inside), surface)
            }
            assertTrue("${ground.name} chip: $chip", chip >= 1.3)
            assertTrue("${ground.name} hollow: $hollow", hollow >= 1.3)
        }
    }
}
