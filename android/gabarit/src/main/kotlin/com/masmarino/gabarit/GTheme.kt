package com.masmarino.gabarit

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
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.platform.LocalContext
import android.provider.Settings

// Gabarit's theme for Compose, as on the iPhone: flat, fine borders, small radii, slate (light) and graphite (dark)
// neutrals, rust for the accent, IBM Plex. Material 3 is set to the same colours and text, for what an app still takes
// from it (its menus, dialogs, sheets).

/**
 * Grounds that replace Gabarit's (an app's colour themes, a black mode): the pages' ground, the side columns, the
 * surfaces (cards, sheets, menus), the tracks (fields, controls) and the fine lines. Texts, the accent and the frame stay
 * Gabarit's. `gradient`: painted behind the screen and the sheets (`gPageGround`), the grounds then being veils on it.
 */
@Immutable
data class GGrounds(
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
private val LocalGrounds = staticCompositionLocalOf<GGrounds?> { null }

/** The current theme's tokens: `G.colors.surface`, `G.type.body`. */
object G {
    val colors: GColors @Composable @ReadOnlyComposable get() = LocalColors.current
    val type: GTypography @Composable @ReadOnlyComposable get() = LocalTypography.current
    val isDark: Boolean @Composable @ReadOnlyComposable get() = LocalDark.current

    /** The grounds of the app's appearance (a colour theme…), or null: Gabarit's. */
    val grounds: GGrounds? @Composable @ReadOnlyComposable get() = LocalGrounds.current

    /** Menus', dialogs' and sheets' ground: opaque, under a gradient too. */
    val surfaceOpaque: Color @Composable @ReadOnlyComposable get() = LocalGrounds.current?.surfaceOpaque ?: LocalColors.current.surface

    /** The pages' ground, opaque. */
    val backgroundOpaque: Color @Composable @ReadOnlyComposable get() = LocalGrounds.current?.backgroundOpaque ?: LocalColors.current.background
}

/**
 * The page's ground behind this view: under a colour theme, its gradient and the ground's veil over it; otherwise
 * Gabarit's background. (Under a gradient, `G.colors.background` is transparent: only this paints it, once.)
 */
fun Modifier.gPageGround(): Modifier = composed {
    val grounds = LocalGrounds.current
    val gradient = grounds?.gradient
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
 * At the root of each screen: Gabarit's theme, and Material 3 set to the same colours and text. `dark`: light or dark
 * (by default as the system); `grounds`: grounds that replace Gabarit's.
 */
@Composable
fun GTheme(dark: Boolean = isSystemInDarkTheme(), grounds: GGrounds? = null, content: @Composable () -> Unit) {
    GScheme(dark, grounds, content)
}

/** A part always light or always dark (the frame): Gabarit's theme, forced. */
@Composable
fun GScheme(dark: Boolean, grounds: GGrounds? = null, content: @Composable () -> Unit) {
    val base = if (dark) GDarkColors else GLightColors
    val colors = if (grounds == null) base
    else base.copy(background = if (grounds.gradient != null) Color.Transparent else grounds.background, sidebar = grounds.sidebar,
        surface = grounds.surface, track = grounds.track, hairline = grounds.hairline)
    val surface = grounds?.surfaceOpaque ?: colors.surface
    val type = GTypography()
    val material = (if (dark) darkColorScheme() else lightColorScheme()).copy(
        primary = colors.primary, onPrimary = colors.onPrimary,
        secondary = colors.accent, onSecondary = colors.onPrimary,
        tertiary = colors.accentText,
        background = colors.background, onBackground = colors.textPrimary,
        surface = surface, onSurface = colors.textPrimary,
        surfaceVariant = colors.track, onSurfaceVariant = colors.textSecondary,
        surfaceContainer = surface, surfaceContainerLow = surface, surfaceContainerHigh = surface,
        surfaceContainerHighest = colors.track, surfaceContainerLowest = grounds?.backgroundOpaque ?: colors.background,
        outline = colors.border, outlineVariant = colors.hairline,
        error = colors.error, onError = colors.onPrimary,
        scrim = Color.Black.copy(alpha = 0.35f),
    )
    val materialType = Typography(
        displayLarge = type.largeTitle, displayMedium = type.largeTitle, displaySmall = type.title,
        headlineLarge = type.title, headlineMedium = type.title2, headlineSmall = type.title3,
        titleLarge = type.title3, titleMedium = type.headline, titleSmall = type.subheadline,
        bodyLarge = type.body, bodyMedium = type.callout, bodySmall = type.footnote,
        labelLarge = type.callout, labelMedium = type.caption, labelSmall = type.caption2,
    )
    CompositionLocalProvider(LocalColors provides colors, LocalTypography provides type, LocalDark provides dark,
        LocalGrounds provides grounds) {
        MaterialTheme(colorScheme = material, typography = materialType, content = content)
    }
}

/** Whether the system asks for reduced motion (animations off, or their scale at 0). */
@Composable
@ReadOnlyComposable
fun gReduceMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
}
