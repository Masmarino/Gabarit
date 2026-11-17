package com.masmarino.gabarit

import android.app.UiModeManager
import android.content.Context
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalContext

// Gabarit's theme for Compose (4.0): one ground runs under the whole screen, bars included, and two glasses lie on it
// (the content glass for panels, the liquid glass for what commands and floats). Light is the edge of things: no lines
// between rows, no rim around cards; a line stays only on controls (a field's 3:1 rim, the focus ring). Slate (light)
// and graphite (dark) neutrals, rust for the accent, IBM Plex. Material 3 is set to the same colours and text, for what
// an app still takes from it (its menus, dialogs, sheets).

/**
 * Grounds that replace Gabarit's (an app's 3.x colour themes, a black mode): the pages' ground, the side columns, the
 * surfaces (cards, sheets, menus), the tracks (fields, controls) and the fine lines. Texts, the accent and the frame stay
 * Gabarit's. `gradient`: painted behind the screen and the sheets (`gPageGround`), the grounds then being veils on it.
 * (Named `GGrounds` before 4.0: that name is now the ambiances', `GGrounds.light`…)
 */
@Immutable
data class GThemeGrounds(
    val background: Color,
    val sidebar: Color,
    val surface: Color,
    val track: Color,
    val hairline: Color,
    val gradient: List<Color>? = null,
) {
    /** The pages' ground, opaque: the veil on the gradient's middle. */
    val backgroundOpaque: Color get() = gradient?.let { background.compositeOver(lerp(it.first(), it.last(), 0.5f)) } ?: background

    /** The surfaces, opaque (menus, dialogs: nothing shows through them). */
    val surfaceOpaque: Color get() = if (gradient == null) surface else surface.compositeOver(backgroundOpaque)
}

private val LocalColors = staticCompositionLocalOf { GLightColors }
private val LocalTypography = staticCompositionLocalOf { GTypography() }
private val LocalDark = staticCompositionLocalOf { false }
private val LocalGrounds = staticCompositionLocalOf<GThemeGrounds?> { null }
private val LocalGround = staticCompositionLocalOf { GGrounds.light }
private val LocalGroundTone = staticCompositionLocalOf { GGroundTones.light }
private val LocalAccentTone = staticCompositionLocalOf<GAccentTone?> { null }
private val LocalReduceTransparency = staticCompositionLocalOf { false }
private val LocalHighContrast = staticCompositionLocalOf { false }

/** The current theme's tokens: `G.colors.surface`, `G.type.body`, `G.ground`. */
object G {
    val colors: GColors @Composable @ReadOnlyComposable get() = LocalColors.current
    val type: GTypography @Composable @ReadOnlyComposable get() = LocalTypography.current
    val isDark: Boolean @Composable @ReadOnlyComposable get() = LocalDark.current

    /** The ground under the screen (4.0): `GGrounds.light` or `dark` by default, an ambiance, a plain colour. */
    val ground: GGroundSpec @Composable @ReadOnlyComposable get() = LocalGround.current

    /** The current ground's tone (its veil, its ink's opacities, its liquid glass's white), computed once per ground. */
    val groundTone: GGroundTone @Composable @ReadOnlyComposable get() = LocalGroundTone.current

    /**
     * The accent's roles when the ground brings its own accent or the theme was given one (4.2): its text, the ink on
     * it (`onAccent`, for what an app draws on the accent), the selection's opacity. Null: Gabarit's rust. `G.colors`
     * already carries them (`accent`, `accentText`, `selectedFill`, `primary`, `onPrimary`).
     */
    val accentTone: GAccentTone? @Composable @ReadOnlyComposable get() = LocalAccentTone.current

    /** The glass is dense, nothing shows through it (the theme's `reduceTransparency`). */
    val reduceTransparency: Boolean @Composable @ReadOnlyComposable get() = LocalReduceTransparency.current

    /** The glass's light becomes a true rim (the theme's `highContrast`). */
    val highContrast: Boolean @Composable @ReadOnlyComposable get() = LocalHighContrast.current

    /** The 3.x grounds of the app's appearance (a colour theme…), or null: Gabarit's. */
    val grounds: GThemeGrounds? @Composable @ReadOnlyComposable get() = LocalGrounds.current

    /**
     * Menus', dialogs' and sheets' ground: opaque (they are other windows, nothing of the page can be blurred under
     * them). 4.0: the thick glass laid on the ground's middle; under 3.x grounds, their surface.
     */
    val surfaceOpaque: Color
        @Composable @ReadOnlyComposable get() = LocalGrounds.current?.surfaceOpaque
            ?: LocalColors.current.glassThick.compositeOver(LocalGround.current.middle)

    /** The pages' ground, opaque: the ground's middle under its veil (3.x grounds: their background). */
    val backgroundOpaque: Color
        @Composable @ReadOnlyComposable get() = LocalGrounds.current?.backgroundOpaque
            ?: LocalColors.current.groundVeil.compositeOver(LocalGround.current.middle)
}

/**
 * The page's ground behind this view. 4.0: the current ground (`gGround()`), placed as it lies under the whole window.
 * Under 3.x grounds (`GTheme(grounds = …)`), as before: their gradient and the ground's veil over it, or their background.
 */
fun Modifier.gPageGround(): Modifier = composed {
    val grounds = LocalGrounds.current ?: return@composed gGround()
    val gradient = grounds.gradient
    // One light, from above: the page is lit at its top, whatever its ground.
    val pageLight = G.colors.pageLight
    val light = Brush.verticalGradient(0f to pageLight, 0.4f to pageLight.copy(alpha = 0f))
    if (gradient == null) background(G.colors.background).background(light)
    else {
        val brush = Brush.linearGradient(if (gradient.size == 1) gradient + gradient else gradient)
        drawBehind {
            drawRect(brush)
            drawRect(grounds.background)
            drawRect(light)
        }
    }
}

/**
 * At the root of each screen: Gabarit's theme, and Material 3 set to the same colours and text.
 *
 * - `dark`: light or dark (by default as the system); it picks the default ground (`GGrounds.light` or `dark`).
 * - `ground`: another ground (an ambiance, `GGroundSpec.plain(…)`); its mode then decides the appearance, and the ink
 *   (the texts) follows it.
 * - `grounds`: 3.x grounds that replace Gabarit's (kept for apps not yet on the ground).
 * - `reduceTransparency`: dense glass (`GGlassValues.reduced`); by default when the battery saver is on.
 * - `highContrast`: the glass's light becomes a true rim; by default as the system's contrast (Android 14) or its
 *   high-contrast text.
 * - `accent` (4.2): the app's own accent, over the ground's (`GGroundSpec.accent`); null: the ground's, or Gabarit's
 *   rust. With one, the accent, its text (links, the chosen tab), the selection, the focus ring, the tinted and the
 *   prominent glass, and the primary buttons (`primary`, the ink on them `onPrimary`) take it, their roles computed on
 *   the ground (`GGroundSpec.accentToneOn`, read back by `G.accentTone`). Without one, nothing changes.
 */
@Composable
fun GTheme(
    dark: Boolean = isSystemInDarkTheme(),
    grounds: GThemeGrounds? = null,
    ground: GGroundSpec? = null,
    reduceTransparency: Boolean = gSystemReduceTransparency(),
    highContrast: Boolean = gSystemHighContrast(),
    accent: Color? = null,
    content: @Composable () -> Unit,
) {
    GScheme(dark, grounds, ground, reduceTransparency, highContrast, accent, content)
}

/**
 * A part always light or always dark (the graphite frame): Gabarit's theme, forced. `ground`: as `GTheme`'s; by
 * default the mode's own ground. The accessibility settings are kept from the theme around it. `accent`: as `GTheme`'s;
 * by default the accent around it (the ground's own, if it brings one).
 */
@Composable
fun GScheme(
    dark: Boolean,
    grounds: GThemeGrounds? = null,
    ground: GGroundSpec? = null,
    reduceTransparency: Boolean = LocalReduceTransparency.current,
    highContrast: Boolean = LocalHighContrast.current,
    accent: Color? = null,
    content: @Composable () -> Unit,
) {
    val spec = ground ?: if (dark) GGrounds.dark else GGrounds.light
    val tone = remember(spec) { gToneOf(spec) }
    val isDark = if (ground != null) spec.mode == GGroundMode.DARK else dark
    // 4.2: the theme's accent, else the ground's, else (a part inside a theme) the accent around it.
    val accentColor = accent ?: spec.accent ?: LocalAccentTone.current?.accent
    val accentTone = remember(spec, tone, accentColor) { accentColor?.let { spec.accentToneOn(tone, it) } }
    val mode = if (isDark) GDarkColors else GLightColors
    val base = gColorsOn(mode, spec, tone, custom = ground != null).let { if (accentTone == null) it else it.withAccent(accentTone) }
    val colors = if (grounds == null) base
    else base.copy(background = if (grounds.gradient != null) Color.Transparent else grounds.background, sidebar = grounds.sidebar,
        surface = grounds.surface, track = grounds.track, hairline = grounds.hairline)
    val surface = grounds?.surfaceOpaque ?: colors.glassThick.compositeOver(spec.middle)
    val type = GTypography()
    val material = (if (isDark) darkColorScheme() else lightColorScheme()).copy(
        primary = colors.primary, onPrimary = colors.onPrimary,
        secondary = colors.accent, onSecondary = colors.onPrimary,
        tertiary = colors.accentText,
        background = colors.background, onBackground = colors.textPrimary,
        surface = surface, onSurface = colors.textPrimary,
        surfaceVariant = colors.track, onSurfaceVariant = colors.textSecondary,
        surfaceContainer = surface, surfaceContainerLow = surface, surfaceContainerHigh = surface,
        surfaceContainerHighest = colors.track, surfaceContainerLowest = grounds?.backgroundOpaque ?: colors.background,
        outline = colors.border, outlineVariant = colors.hairline,
        error = colors.error, onError = mode.onPrimary,
        scrim = Color.Black.copy(alpha = 0.35f),
    )
    val materialType = Typography(
        displayLarge = type.largeTitle, displayMedium = type.largeTitle, displaySmall = type.title,
        headlineLarge = type.title, headlineMedium = type.title2, headlineSmall = type.title3,
        titleLarge = type.title3, titleMedium = type.headline, titleSmall = type.subheadline,
        bodyLarge = type.body, bodyMedium = type.callout, bodySmall = type.footnote,
        labelLarge = type.callout, labelMedium = type.caption, labelSmall = type.caption2,
    )
    CompositionLocalProvider(LocalColors provides colors, LocalTypography provides type, LocalDark provides isDark,
        LocalGrounds provides grounds, LocalGround provides spec, LocalGroundTone provides tone, LocalAccentTone provides accentTone,
        LocalReduceTransparency provides reduceTransparency, LocalHighContrast provides highContrast) {
        MaterialTheme(colorScheme = material, typography = materialType) {
            // Set inside: MaterialTheme sets its ripple.
            CompositionLocalProvider(LocalIndication provides GVeilIndication(colors.press), content = content)
        }
    }
}

/** A ground's tone, cached: computed once per ground (dense glass if no veil holds). */
internal fun gToneOf(spec: GGroundSpec): GGroundTone = GToneCache.of(spec)

private object GToneCache {
    // The last grounds' (a photo's tone is one of them): a few dozen, at most.
    private val tones = object : LinkedHashMap<GGroundSpec, GGroundTone>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<GGroundSpec, GGroundTone>?) = size > 48
    }

    @Synchronized
    fun of(spec: GGroundSpec): GGroundTone = tones.getOrPut(spec) {
        spec.tone() ?: GGroundTone(GGlassValues.reduced, spec.resolvedInk, 1f, 1f, 0f, spec.resolvedShade)
    }
}

/**
 * The mode's colours set on a ground: its ink and its glass (their colours, their rims', their shadows'), the tracks a
 * veil of the ink. On a ground of
 * the app's (`custom`), the texts are its ink's steps too, which hold 4.5:1 (3:1 for the discreet one) on its glass.
 */
internal fun gColorsOn(base: GColors, spec: GGroundSpec, tone: GGroundTone, custom: Boolean): GColors {
    val k = spec.kind.values
    val white = Color.White
    val ink = tone.ink
    val ink2 = ink.copy(alpha = tone.ink2)
    val ink3 = ink.copy(alpha = tone.ink3)
    val glassed = base.copy(
        // The tracks (a switch's, a slider's, a placeholder's) are a veil of the ink: the glass shows through them.
        track = ink.copy(alpha = 0.14f),
        ink = ink, ink2 = ink2, ink3 = ink3,
        groundVeil = spec.glass.copy(alpha = tone.veil),
        glassThin = spec.glass.copy(alpha = k.thin), glassRegular = spec.glass.copy(alpha = k.regular),
        glassThick = spec.glass.copy(alpha = k.thick), glassLiquid = white.copy(alpha = tone.liquid),
        glassRim = white.copy(alpha = k.rim), glassRimEdge = white.copy(alpha = k.rimEdge),
        liquidRim = white.copy(alpha = k.liquidRim), liquidRimSoft = white.copy(alpha = k.liquidRimSoft),
        glassRimTop = white.copy(alpha = k.rimTop), glassRimBottom = white.copy(alpha = k.rimBottom), glassSheen = white.copy(alpha = k.sheen),
        liquidRimTop = white.copy(alpha = k.liquidRimTop), liquidRimBottom = white.copy(alpha = k.liquidRimBottom),
        liquidSheen = white.copy(alpha = k.liquidSheen),
        glassShadow = tone.shade.copy(alpha = k.shadow), glassShadowNear = tone.shade.copy(alpha = k.shadowNear),
        liquidShadow = tone.shade.copy(alpha = k.liquidShadow), glassHollow = tone.shade.copy(alpha = k.hollow),
    )
    return if (!custom) glassed else glassed.copy(textPrimary = ink, textSecondary = ink2, textDiscret = ink3)
}

/**
 * These colours with an accent of their own (4.2, `GTheme(accent = …)` or a ground's `accent`): the accent and the
 * focus ring, its text (links, the chosen tab), the selection, and the primary buttons (the accent, the ink on it). For
 * an app that builds its colours itself; `tone` from `GGroundSpec.accentTone()` or `accentToneOn(…)`.
 */
fun GColors.withAccent(tone: GAccentTone): GColors = copy(
    accent = tone.accent, accentText = tone.accentText, selectedFill = tone.accent.copy(alpha = tone.selected),
    primary = tone.accent, primaryHover = lerp(tone.accent, tone.onAccent, 0.15f), onPrimary = tone.onAccent,
)

/** The ground's middle, opaque: its stops' middle (what lies under an opaque surface, a popup's). */
internal val GGroundSpec.middle: Color
    get() = if (stops.size == 1) stops[0] else if (stops.size % 2 == 1) stops[stops.size / 2]
    else lerp(stops[stops.size / 2 - 1], stops[stops.size / 2], 0.5f)

/** Whether the system asks for reduced motion (animations off, or their scale at 0). */
@Composable
@ReadOnlyComposable
fun gReduceMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
}

/**
 * Whether the glass should be dense: Android has no single "reduce transparency" setting; the battery saver is taken
 * as one (a blur costs). An app can pass its own setting to `GTheme(reduceTransparency = …)`.
 */
@Composable
@ReadOnlyComposable
fun gSystemReduceTransparency(): Boolean {
    val power = LocalContext.current.getSystemService(Context.POWER_SERVICE) as? PowerManager
    return power?.isPowerSaveMode == true
}

/** Whether the system asks for more contrast: its contrast level (Android 14) or its high-contrast text. */
@Composable
@ReadOnlyComposable
fun gSystemHighContrast(): Boolean {
    val context = LocalContext.current
    if (Build.VERSION.SDK_INT >= 34) {
        val ui = context.getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
        if ((ui?.contrast ?: 0f) > 0f) return true
    }
    // The high-contrast text's setting: readable, though not in the public API.
    return Settings.Secure.getInt(context.contentResolver, "high_text_contrast_enabled", 0) == 1
}
