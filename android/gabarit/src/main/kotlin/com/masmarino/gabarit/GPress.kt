package com.masmarino.gabarit

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.IndicationNodeFactory
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.node.DelegatableNode
import androidx.compose.ui.node.DrawModifierNode
import kotlinx.coroutines.launch

// Under the finger, as on the Mac: Gabarit's veil rather than Material's ripple, for anything clickable under `GTheme`.

/** A gallery draws what is below as held down, without a finger. */
val LocalGPressedPreview = staticCompositionLocalOf { false }

/** Whether this source is held down (or a gallery says so). */
@Composable
fun InteractionSource.gPressed(): Boolean {
    val pressed by collectIsPressedAsState()
    return pressed || LocalGPressedPreview.current
}

/** The press veil: quick to come, a little slower to go. */
@Immutable
internal data class GVeilIndication(val color: Color) : IndicationNodeFactory {
    override fun create(interactionSource: InteractionSource): DelegatableNode = GVeilNode(interactionSource, color)
}

private class GVeilNode(private val source: InteractionSource, private val color: Color) : Modifier.Node(), DrawModifierNode {
    private val strength = Animatable(0f)

    override fun onAttach() {
        coroutineScope.launch {
            source.interactions.collect { interaction ->
                when (interaction) {
                    is PressInteraction.Press -> launch { strength.animateTo(1f, tween(70)) }
                    is PressInteraction.Release, is PressInteraction.Cancel -> launch { strength.animateTo(0f, tween(160)) }
                }
            }
        }
    }

    override fun ContentDrawScope.draw() {
        drawContent()
        val value = strength.value
        if (value > 0f) drawRect(color.copy(alpha = color.alpha * value))
    }
}
