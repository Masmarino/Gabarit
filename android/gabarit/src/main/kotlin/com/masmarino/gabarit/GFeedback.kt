package com.masmarino.gabarit

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

// What Gabarit says back, as on the iPhone: badges, an empty page, placeholders while loading, the typing dots, passing
// messages, an error's alert.

/** The states (success, warning, error, information), rather than the system's colours. */
enum class GTone {
    Success, Warning, Error, Info;

    /** The state's colour (a mark, a dot). */
    val base: Color
        @Composable get() = when (this) {
            Success -> G.colors.success
            Warning -> G.colors.warning
            Error -> G.colors.error
            Info -> G.colors.info
        }

    /** A badge's translucent ground in this state. */
    val tint: Color @Composable get() = base.copy(alpha = 0.14f)

    /** This state's text on the page: 4.5:1 at least. */
    val text: Color
        @Composable get() = when (this) {
            Success -> G.colors.successText
            Warning -> G.colors.warningText
            Error -> G.colors.errorText
            Info -> G.colors.infoText
        }

    /** A readable text on this state's tint. */
    val tintText: Color
        @Composable get() = when (this) {
            Success -> G.colors.successOnTint
            Warning -> G.colors.warningOnTint
            Error -> G.colors.errorOnTint
            Info -> G.colors.infoOnTint
        }
}

/** A Gabarit surface: flat, a fine rim. */
fun Modifier.gSurface(shape: RoundedCornerShape = RoundedCornerShape(GRadius.md), ground: Color, rim: Color): Modifier =
    background(ground, shape).border(1.dp, rim, shape)

/** A small label: a state's tint, or the hover's veil with no state; `icon` (the Mac's name) before it. */
@Composable
fun GBadge(title: String, icon: String? = null, tone: GTone? = null) {
    val color = tone?.tintText ?: G.colors.textSecondary
    Row(Modifier.clip(RoundedCornerShape(GRadius.sm)).background(tone?.tint ?: G.colors.hover).padding(horizontal = 8.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        if (icon != null) GIcon(icon, size = 10f, color = color)
        Text(title, style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold), color = color)
    }
}

/** An empty page: an icon in a framed square, a title, a sentence, and what to do (a primary button). */
@Composable
fun GEmptyState(icon: String, title: String, message: String, modifier: Modifier = Modifier, actionTitle: String? = null,
                actionIcon: String? = null, action: (() -> Unit)? = null) {
    val colors = G.colors
    Column(modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Box(Modifier.size(80.dp).gSurface(RoundedCornerShape(GRadius.lg), colors.surface, colors.hairline), contentAlignment = Alignment.Center) {
            GIcon(icon, size = 32f, weight = FontWeight.Light, color = colors.textSecondary)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = G.type.title3, color = colors.textPrimary, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
            Text(message, style = G.type.subheadline, color = colors.textSecondary, textAlign = TextAlign.Center,
                modifier = Modifier.widthIn(max = 320.dp))
        }
        if (actionTitle != null && action != null) GButton(actionTitle, action, variant = GButtonVariant.Primary, icon = actionIcon)
    }
}

/** A placeholder while content loads: a soft shape with a slow shimmer (still when motion is reduced). */
@Composable
fun GSkeleton(modifier: Modifier = Modifier, height: Dp = 20.dp, cornerRadius: Dp = GRadius.sm) {
    val colors = G.colors
    val still = gReduceMotion()
    val shape = RoundedCornerShape(cornerRadius)
    val phase = if (still) null else rememberInfiniteTransition(label = "skeleton")
        .animateFloat(1f, -1f, infiniteRepeatable(tween(1400, easing = LinearEasing)), label = "skeleton")
    val shimmer = colors.surface.copy(alpha = 0.6f)
    Box(modifier.fillMaxWidth().height(height).clip(shape).background(colors.track).clearAndSetSemantics {}
        .then(if (phase == null) Modifier else Modifier.drawWithContent {
            drawContent()
            val band = size.width * 0.6f
            val x = phase.value * size.width * 1.4f
            drawRect(Brush.horizontalGradient(listOf(Color.Transparent, shimmer, Color.Transparent), startX = x, endX = x + band))
        }))
}

/** Three dots that wave while an answer is being written. `label`: what a screen reader says. */
@Composable
fun GTypingDots(label: String) {
    val accent = G.colors.accent
    val still = gReduceMotion()
    val transition = rememberInfiniteTransition(label = "dots")
    val time by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(1050, easing = LinearEasing), RepeatMode.Restart), label = "dots")
    Row(Modifier.height(12.dp).clearAndSetSemantics { contentDescription = label }, horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically) {
        repeat(3) { i ->
            val wave = if (still) 0f else ((kotlin.math.sin((time * 2 * Math.PI) - i * 0.9) + 1) / 2).toFloat()
            Box(Modifier.offset(y = (-3 * wave).dp).size(6.dp).background(accent.copy(alpha = 0.35f + 0.65f * wave), CircleShape))
        }
    }
}

// MARK: Passing messages

/** A passing message: a sentence and its icon (the Mac's name). */
data class GToast(val text: String, val icon: String, val id: Long = System.nanoTime())

/** A screen's passing messages: one at a time, gone after a few seconds. Shown by `GToastHost`. */
@Stable
class GToastState {
    var current: GToast? by mutableStateOf(null)
        private set

    fun show(text: String, icon: String) {
        current = GToast(text, icon)
    }

    fun dismiss() {
        current = null
    }
}

@Composable
fun rememberGToastState(): GToastState = remember { GToastState() }

/**
 * The state's passing message at the bottom of `content`: the ink of a primary button, a floating shadow, said by
 * screen readers as it shows; it slides in (fades only with reduced motion).
 */
@Composable
fun GToastHost(state: GToastState, modifier: Modifier = Modifier, durationMillis: Long = 2500, content: @Composable BoxScope.() -> Unit) {
    val colors = G.colors
    val still = gReduceMotion()
    val toast = state.current
    LaunchedEffect(toast?.id) {
        if (toast != null) {
            delay(durationMillis)
            state.dismiss()
        }
    }
    Box(modifier) {
        content()
        AnimatedVisibility(toast != null, Modifier.align(Alignment.BottomCenter).padding(bottom = 32.dp),
            enter = if (still) fadeIn() else fadeIn() + slideInVertically { it },
            exit = if (still) fadeOut() else fadeOut() + slideOutVertically { it }) {
            val shown = toast ?: return@AnimatedVisibility
            Row(Modifier.shadow(16.dp, RoundedCornerShape(GRadius.md)).background(colors.primary, RoundedCornerShape(GRadius.md))
                .padding(horizontal = 20.dp, vertical = 12.dp).semantics { liveRegion = LiveRegionMode.Polite },
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GIcon(shown.icon, size = 15f, color = colors.onPrimary)
                Text(shown.text, style = G.type.subheadline.copy(fontWeight = FontWeight.Medium), color = colors.onPrimary)
            }
        }
    }
}

/** A plain alert for an error message: the title, the message, "OK". It shows while `message` is set. */
@Composable
fun GErrorAlert(title: String, message: String?, onDismiss: () -> Unit, ok: String = "OK") {
    if (message == null) return
    val colors = G.colors
    AlertDialog(onDismissRequest = onDismiss, containerColor = G.surfaceOpaque, shape = RoundedCornerShape(GRadius.lg),
        title = { Text(title, style = G.type.title3, color = colors.textPrimary) },
        text = { Text(message, style = G.type.body, color = colors.textSecondary) },
        confirmButton = { TextButton(onDismiss) { Text(ok, style = G.type.body.copy(fontWeight = FontWeight.SemiBold), color = colors.accentText) } })
}
