package com.masmarino.gabarit

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin

// The ground and its tone (4.0). The values come from tokens/gabarit.json (GTokens.kt); the computation is
// tools/tokens.py's `tone()`, step for step, for the grounds an app brings at run time. GGroundTest compares it with
// the tones the generator wrote.

/** Whether a ground takes dark ink (LIGHT) or light ink (DARK). */
enum class GGroundMode { LIGHT, DARK }

/**
 * A ground's light: a radial wash of [color] at ([x], [y]), fractions of the window, its radius a fraction of the
 * window's longer side, [strength] the colour's opacity at its centre.
 */
@Immutable
data class GGroundLight(val color: Color, val x: Float, val y: Float, val radius: Float, val strength: Float)

/**
 * An ambiance: a linear gradient of 2 to 4 [stops] at [angle] (CSS degrees: 180 runs from the top down), plus a
 * [light]. [glass] is the colour of its content glass and of its veil; [ink] and [shade] its own, or the mode's main
 * text and its darkest stop deepened.
 */
@Immutable
data class GGroundSpec(
    val name: String,
    val mode: GGroundMode,
    val kind: GGlassKind,
    val angle: Float,
    val stops: List<Color>,
    val light: GGroundLight,
    val glass: Color,
    val ink: Color? = null,
    val shade: Color? = null,
) {
    init { require(stops.size in 1..4) { "a ground has 1 to 4 stops" } }

    /** The ink: the ambiance's own, or the apps' main text in its mode. */
    val resolvedInk: Color get() = ink ?: if (mode == GGroundMode.LIGHT) GLightColors.textPrimary else GDarkColors.textPrimary

    /** The shadows' colour: the ambiance's own, or its darkest stop, 70 % of the way to black (rounded to a byte). */
    val resolvedShade: Color
        get() = shade ?: stops.minBy { GLuminance.of(it) }.let { darkest ->
            // From the channel's byte, as the generator's (a Float's channel is not exactly byte / 255).
            fun byte(v: Float) = GLuminance.roundHalfEven(Math.rint(v * 255.0) * 0.3) / 255f
            Color(byte(darkest.red), byte(darkest.green), byte(darkest.blue))
        }

    /** The stop under the light's centre: its place projected on the gradient's line, rounded to the nearest stop. */
    val lightStop: Int
        get() {
            val radians = Math.toRadians(angle.toDouble())
            val dx = sin(radians)
            val dy = -cos(radians)
            val reach = (abs(dx) + abs(dy)) / 2
            val along = min(max(((light.x - 0.5) * dx + (light.y - 0.5) * dy) / reach / 2 + 0.5, 0.0), 1.0)
            return GLuminance.roundHalfEven(along * (stops.size - 1))
        }

    /** Where the ink may land: every stop, and the light at its centre over the stop under it. */
    val worstPoints: List<DoubleArray>
        get() = stops.map { GLuminance.rgb(it) } +
            listOf(GLuminance.laid(GLuminance.rgb(light.color), light.strength.toDouble(), GLuminance.rgb(stops[lightStop])))

    /**
     * The tone: the least veil that lets the ink hold 4.5:1 (its secondary step at `inkSecondaryMax`, its discreet
     * one 3:1 at `inkDiscretMax`) at every worst point, then the least opacities of the ink's steps from their nominal
     * ones, then the most white for the liquid glass, by steps of a hundredth. Null: no veil holds.
     */
    fun tone(): GGroundTone? {
        val ink = GLuminance.rgb(resolvedInk)
        val glass = GLuminance.rgb(glass)
        val points = worstPoints
        val white = doubleArrayOf(1.0, 1.0, 1.0)
        fun holds(veil: Double, alpha: Double, minimum: Double, liquid: Double = 0.0) = points.all { point ->
            val under = GLuminance.laid(white, liquid, GLuminance.laid(glass, veil, point))
            GLuminance.contrast(GLuminance.laid(ink, alpha, under), under) >= minimum
        }
        val steps = (0..100).map { it / 100.0 }
        val text = GGlassValues.textMinimum.toDouble()
        val edge = GGlassValues.edgeMinimum.toDouble()
        val veil = steps.firstOrNull {
            holds(it, 1.0, text) && holds(it, GGlassValues.inkSecondaryMax.toDouble(), text) &&
                holds(it, GGlassValues.inkDiscretMax.toDouble(), edge)
        } ?: return null
        val ink2 = steps.firstOrNull { it >= GGlassValues.inkSecondary - 1e-6 && holds(veil, it, text) } ?: 1.0
        val ink3 = steps.firstOrNull { it >= GGlassValues.inkDiscret - 1e-6 && holds(veil, it, edge) } ?: 1.0
        val liquid = steps.reversed().firstOrNull { it <= kind.values.liquid + 1e-6 && holds(veil, 1.0, text, it) } ?: 0.0
        return GGroundTone(veil.toFloat(), resolvedInk, ink2.toFloat(), ink3.toFloat(), liquid.toFloat(), resolvedShade)
    }

    companion object {
        /** One colour, as a ground (a community's colour, a plain theme). */
        fun plain(color: Color, mode: GGroundMode, kind: GGlassKind, glass: Color) = GGroundSpec(
            "plain", mode, kind, 180f, listOf(color, color), GGroundLight(color, 0.5f, 0f, 1f, 0f), glass,
        )
    }
}

/**
 * A ground's tone: the veil laid over the whole ground (the glass's colour at [veil]), the ink and the opacities of
 * its secondary ([ink2]) and discreet ([ink3]) steps, the liquid glass's white, the colour of the shadows.
 */
@Immutable
data class GGroundTone(val veil: Float, val ink: Color, val ink2: Float, val ink3: Float, val liquid: Float, val shade: Color)

/** WCAG's luminance and contrast, in doubles (as tools/tokens.py). */
object GLuminance {
    fun rgb(color: Color) = doubleArrayOf(color.red.toDouble(), color.green.toDouble(), color.blue.toDouble())

    fun of(color: Color) = of(rgb(color))

    fun of(c: DoubleArray): Double {
        fun channel(v: Double) = if (v <= 0.04045) v / 12.92 else ((v + 0.055) / 1.055).pow(2.4)
        return 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])
    }

    fun contrast(a: DoubleArray, b: DoubleArray): Double {
        val la = of(a)
        val lb = of(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /** [top] at [opacity] on the opaque [under]. */
    fun laid(top: DoubleArray, opacity: Double, under: DoubleArray) =
        DoubleArray(3) { top[it] * opacity + under[it] * (1 - opacity) }

    /** Rounding half to even, as Python's round(). */
    fun roundHalfEven(value: Double): Int = Math.rint(value).roundToInt()
}
