package com.masmarino.gabarit

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.error
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.LineHeightStyle
import kotlin.math.roundToInt

// Gabarit's controls for Compose, as GabaritApple draws them on the iPhone: drawn by Gabarit, not the system's, at the
// finger's sizes (44 high at least for what is touched).

/** The controls' heights: a field, a compact control (a menu, chips, the stepper), a button. */
object GControlMetrics {
    val height = 44.dp
    val compact = 36.dp
    val button = 38.dp
    /** Under the finger: what a touch reaches, at least. */
    val touchTarget = 44.dp
}

private val phosphor = FontFamily(Font(R.font.phosphor))
private val phosphorFill = FontFamily(Font(R.font.phosphor_fill))

/**
 * An icon, by the Mac's name (`"bell"`, `"lock.fill"`), drawn by Phosphor. `size`: as an SF Symbol's point size;
 * Phosphor draws in a wider margin, so its icon is asked a quarter larger to look the same. In the content's colour.
 * Hidden from screen readers unless it has a `description`.
 */
@Composable
fun GIcon(name: String, modifier: Modifier = Modifier, size: Float = 17f, color: Color = LocalContentColor.current,
          weight: FontWeight = FontWeight.Normal, description: String? = null) {
    val glyph = GSymbols.glyph(name) ?: GSymbols.glyph("questionmark") ?: return
    Text(glyph.first.toString(), color = color, fontFamily = if (glyph.second) phosphorFill else phosphor, fontWeight = weight,
        fontSize = (size * 1.25f).sp, lineHeight = (size * 1.25f).sp,
        modifier = modifier.then(if (description == null) Modifier.clearAndSetSemantics {}
        else Modifier.clearAndSetSemantics { contentDescription = description }))
}

/**
 * An icon by the Mac's name, shaped as Material's `Icon`: 24 square unless the modifier sizes it, Phosphor's glyph
 * filling its box, in `tint`. `contentDescription`: what screen readers say (null: hidden from them).
 */
@Composable
fun GIcon(name: String, contentDescription: String?, modifier: Modifier = Modifier, tint: Color = LocalContentColor.current,
          weight: FontWeight = FontWeight.Normal) {
    val glyph = GSymbols.glyph(name) ?: GSymbols.glyph("questionmark")
    val measurer = rememberTextMeasurer()
    Spacer(
        modifier.size(24.dp)
            .then(if (contentDescription == null) Modifier.clearAndSetSemantics {}
            else Modifier.clearAndSetSemantics { this.contentDescription = contentDescription; role = Role.Image })
            .drawWithCache {
                val side = size.minDimension.toSp()
                val layout = glyph?.let {
                    measurer.measure(it.first.toString(), TextStyle(fontFamily = if (it.second) phosphorFill else phosphor, fontWeight = weight,
                        fontSize = side, lineHeight = side,
                        lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.Both)))
                }
                onDrawBehind {
                    if (layout != null) drawText(layout, tint, Offset((size.width - layout.size.width) / 2f, (size.height - layout.size.height) / 2f))
                }
            },
    )
}

// MARK: Relief

/**
 * Raised, a little: a soft shadow, some volume and the light on the top edge; `pressed`: sunk, none of it. `onInk`: on a dark ground (a
 * primary button), the light is the same in both appearances. A hairline stays the edge of things: this only adds to it.
 */
@Composable
fun Modifier.gRaised(shape: Shape, pressed: Boolean = false, onInk: Boolean = false): Modifier {
    if (pressed) return this
    val light = if (onInk) Color.White.copy(alpha = 0.2f) else G.colors.reliefHighlight
    val shade = G.colors.reliefShade
    return this.shadow(1.dp, shape, clip = false).drawWithCache {
        val outline = shape.createOutline(size, layoutDirection, this)
        // One light, from above: on the top edge, shade on the bottom one.
        val brush = Brush.verticalGradient(0f to light, 0.5f to light.copy(alpha = 0f), 1f to shade)
        // A little volume: lighter at the top, a touch darker at the bottom.
        val volume = Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.07f), Color.White.copy(alpha = 0f), Color.Black.copy(alpha = 0.04f)))
        val line = Stroke(1.dp.toPx())
        onDrawWithContent {
            drawContent()
            drawOutline(outline, volume)
            drawOutline(outline, brush, style = line)
        }
    }
}

/** What is on glows a little, in its colour (a switch, a selection). */
fun Modifier.gGlow(color: Color, shape: Shape, radius: Dp = 5.dp): Modifier =
    this.shadow(radius, shape, clip = false, ambientColor = color, spotColor = color)

// MARK: Buttons

/** Gabarit's buttons: ink (primary), fine frame (secondary), no ground (ghost), red (danger). */
enum class GButtonVariant { Primary, Secondary, Ghost, Danger }

/**
 * A Gabarit button. `compact` false: full height (44), a sheet's main button. `destructive`: a secondary or ghost button
 * whose text is red ("Delete", "Leave").
 */
@Composable
fun GButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: GButtonVariant = GButtonVariant.Secondary,
    compact: Boolean = true,
    enabled: Boolean = true,
    destructive: Boolean = false,
    content: @Composable RowScope.() -> Unit,
) {
    val colors = G.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val shape = RoundedCornerShape(GRadius.sm)
    val ground = when (variant) {
        GButtonVariant.Primary -> if (pressed) colors.primaryHover.copy(alpha = 0.85f).compositeOverSafe(colors.background) else colors.primary
        GButtonVariant.Secondary -> if (pressed) colors.track else colors.surface
        GButtonVariant.Ghost -> if (pressed) colors.track else Color.Transparent
        GButtonVariant.Danger -> colors.error.copy(alpha = if (pressed) 0.8f else 1f)
    }
    // The text's red on the press's ground too (4.5:1).
    val foreground = when {
        destructive && (variant == GButtonVariant.Secondary || variant == GButtonVariant.Ghost) -> colors.errorText
        variant == GButtonVariant.Primary || variant == GButtonVariant.Danger -> colors.onPrimary
        variant == GButtonVariant.Secondary -> colors.textPrimary
        else -> colors.textSecondary
    }
    val height = if (compact) GControlMetrics.button else 44.dp
    Row(
        modifier
            .alpha(if (enabled) 1f else GOpacity.disabled)
            .heightIn(min = height)
            .then(if (variant == GButtonVariant.Ghost) Modifier
            else Modifier.gRaised(shape, pressed, onInk = variant == GButtonVariant.Primary || variant == GButtonVariant.Danger))
            .clip(shape)
            .background(ground, shape)
            .then(if (variant == GButtonVariant.Secondary) Modifier.border(1.dp, colors.border.copy(alpha = 0.6f), shape) else Modifier)
            .clickable(interaction, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = if (compact) 12.dp else 16.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalContentColor provides foreground) {
            ProvideTextStyle(G.type.body.copy(fontWeight = FontWeight.SemiBold, color = foreground)) { content() }
        }
    }
}

/** A text button, an icon before it if `icon` (the Mac's name). */
@Composable
fun GButton(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: GButtonVariant = GButtonVariant.Secondary,
    icon: String? = null,
    compact: Boolean = true,
    enabled: Boolean = true,
    destructive: Boolean = false,
) = GButton(onClick, modifier, variant, compact, enabled, destructive) {
    if (icon != null) GIcon(icon, size = 15f)
    Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis)
}

/** A sheet's main button: full width, full height (44). */
@Composable
fun GSheetButton(title: String, onClick: () -> Unit, variant: GButtonVariant = GButtonVariant.Primary, enabled: Boolean = true,
                 destructive: Boolean = false) =
    GButton(title, onClick, Modifier.fillMaxWidth(), variant, compact = false, enabled = enabled, destructive = destructive)

/**
 * A round icon button on the page (a field's, a row's action): the icon (the Mac's name) in `tint`, the track's grey
 * while pressed, a 44 target. `title`: what screen readers say.
 */
@Composable
fun GIconButton(icon: String, title: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true,
                tint: Color = G.colors.textSecondary, size: Float = 17f) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Box(
        modifier.size(GControlMetrics.touchTarget).alpha(if (enabled) 1f else GOpacity.disabled).clip(CircleShape)
            .background(if (pressed) G.colors.track else Color.Transparent)
            .clickable(interaction, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = title },
        contentAlignment = Alignment.Center,
    ) { GIcon(icon, size = size, color = tint) }
}

/**
 * Gabarit's close button: a cross in a circle with a fine rim (on the dark frame when `onFrame`), a 44 target under the
 * finger. `title`: what screen readers say.
 */
@Composable
fun GCloseButton(title: String, onFrame: Boolean = false, onClick: () -> Unit) {
    val colors = G.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Box(
        Modifier.size(GControlMetrics.touchTarget)
            .clickable(interaction, indication = null, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = title },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier.size(28.dp).then(if (onFrame) Modifier else Modifier.gRaised(CircleShape, pressed)).clip(CircleShape)
                .background(if (pressed) (if (onFrame) GFrameColor.closeHover else colors.hover) else Color.Transparent)
                .border(1.dp, if (onFrame) GFrameColor.rim else colors.hairline, CircleShape),
            contentAlignment = Alignment.Center,
        ) { GIcon("xmark", size = 11f, weight = FontWeight.Bold, color = if (onFrame) GFrameColor.text else colors.textSecondary) }
    }
}

// MARK: Switches

/** A switch's track and knob (46 × 28 under the finger): rust when on, the track's grey and a soft rim when off. */
@Composable
fun GSwitch(isOn: Boolean, modifier: Modifier = Modifier) {
    val colors = G.colors
    val still = gReduceMotion()
    val track by animateColorAsState(if (isOn) colors.accent else colors.track, if (still) snap() else tween(180), label = "switch")
    val knob by animateDpAsState(if (isOn) 20.dp else 2.dp, if (still) snap() else tween(180), label = "switch")
    val shape = RoundedCornerShape(14.dp)
    Box(
        modifier.size(width = 46.dp, height = 28.dp)
            .then(if (isOn) Modifier.gGlow(colors.accent, shape) else Modifier)
            .clip(shape).background(track)
            .then(if (isOn) Modifier else Modifier.border(1.dp, colors.border.copy(alpha = 0.35f), shape))
            .clearAndSetSemantics {},
    ) {
        Box(Modifier.offset(x = knob, y = 2.dp).size(24.dp).shadow(1.5.dp, CircleShape)
            .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFEDEDED))), CircleShape))
    }
}

/**
 * A switch row: its title, the sentence that explains it more discreet below, the switch on the right. The whole row
 * is the switch (a touch anywhere, said as one switch), `contentPadding` included (a form card's row:
 * `GFormMetrics.rowPadding`).
 */
@Composable
fun GToggleRow(title: String, isOn: Boolean, onChange: (Boolean) -> Unit, modifier: Modifier = Modifier, detail: String? = null,
               enabled: Boolean = true, contentPadding: PaddingValues = PaddingValues(0.dp)) {
    val colors = G.colors
    Row(
        modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget)
            .alpha(if (enabled) 1f else GOpacity.disabled)
            .clickable(enabled = enabled, role = Role.Switch) { onChange(!isOn) }
            .semantics(mergeDescendants = true) { toggleableState = ToggleableState(isOn) }
            .padding(contentPadding),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = G.type.body, color = colors.textPrimary)
            if (detail != null) Text(detail, style = G.type.caption, color = colors.textDiscret)
        }
        GSwitch(isOn)
    }
}

// MARK: Text

/**
 * A field's frame: the ground, a fine rim, rust and thicker when it has the focus, red if `isError`. In a form's card
 * (`LocalGFormCard`), no rim at rest: the card is its frame, not a frame in a frame. `icon`: discreet
 * before the text (a search's magnifying glass); `keyboardActions`: in place of `onSubmit` (on Done, Go, Send, Search).
 */
@Composable
fun GFieldFrame(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    prompt: String = "",
    singleLine: Boolean = true,
    enabled: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    onSubmit: (() -> Unit)? = null,
    icon: String? = null,
    isError: Boolean = false,
    minLines: Int = if (singleLine) 1 else 3,
    maxLines: Int = if (singleLine) 1 else 8,
    textStyle: TextStyle = G.type.body,
    keyboardActions: KeyboardActions? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.sm)
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val submit = { onSubmit?.invoke(); Unit }
    val inCard = LocalGFormCard.current
    BasicTextField(
        value, onValueChange, modifier.fillMaxWidth().alpha(if (enabled) 1f else GOpacity.disabled),
        enabled = enabled, singleLine = singleLine, minLines = minLines, maxLines = maxLines,
        interactionSource = interaction, keyboardOptions = keyboardOptions, visualTransformation = visualTransformation,
        keyboardActions = keyboardActions ?: KeyboardActions(onDone = { submit() }, onGo = { submit() }, onSend = { submit() }, onSearch = { submit() }),
        textStyle = textStyle.copy(color = colors.textPrimary), cursorBrush = SolidColor(colors.accent),
        decorationBox = { field ->
            val rim = when {
                isError -> colors.error
                focused -> colors.accent
                // In a form's card, no rim at rest: the card is the frame, the ground marks the field.
                inCard -> Color.Transparent
                else -> colors.hairline
            }
            Row(Modifier.fillMaxWidth().heightIn(min = GControlMetrics.height).background(colors.background, shape)
                .border(if (focused || isError) 1.5.dp else 1.dp, rim, shape)
                .padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = if (singleLine) Alignment.CenterVertically else Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (icon != null) GIcon(icon, size = 15f, color = colors.textDiscret)
                Box(Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                    if (value.isEmpty() && prompt.isNotEmpty()) {
                        Text(prompt, style = textStyle, color = colors.textDiscret, maxLines = maxLines, overflow = TextOverflow.Ellipsis)
                    }
                    field()
                }
            }
        },
    )
}

/** A search field: the magnifying glass before the text, `prompt` as the placeholder; "Search" on the keyboard. */
@Composable
fun GSearchField(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier, prompt: String = "", onSubmit: (() -> Unit)? = null) =
    GFieldFrame(value, onValueChange, modifier.semantics { if (prompt.isNotEmpty()) contentDescription = prompt }, prompt,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), onSubmit = onSubmit, icon = "magnifyingglass")

/**
 * A text field with its title: the title above (small, discreet), the field below, full width, `prompt` as the
 * placeholder. The title names the field for screen readers (said once). `trailing`: a button at the field's end;
 * `footer`: a sentence below (the error's, in red, if `isError`).
 */
@Composable
fun GTextField(
    title: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    prompt: String = "",
    singleLine: Boolean = true,
    enabled: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    onSubmit: (() -> Unit)? = null,
    footer: String? = null,
    isError: Boolean = false,
    minLines: Int = if (singleLine) 1 else 3,
    maxLines: Int = if (singleLine) 1 else 8,
    textStyle: TextStyle = G.type.body,
    keyboardActions: KeyboardActions? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    trailing: @Composable RowScope.() -> Unit = {},
) {
    val colors = G.colors
    Column(modifier.fillMaxWidth().padding(vertical = 2.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (title.isNotEmpty()) {
            Text(title, style = G.type.caption.copy(fontWeight = FontWeight.SemiBold), color = colors.textSecondary,
                modifier = Modifier.clearAndSetSemantics {})
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            GFieldFrame(value, onValueChange, Modifier.weight(1f).semantics {
                contentDescription = title
                if (isError && footer != null) error(footer)
            }, prompt, singleLine, enabled, keyboardOptions, onSubmit, isError = isError, minLines = minLines, maxLines = maxLines,
                textStyle = textStyle, keyboardActions = keyboardActions, visualTransformation = visualTransformation)
            trailing()
        }
        if (footer != null) Text(footer, style = G.type.caption, color = if (isError) colors.errorText else colors.textDiscret)
    }
}

// MARK: Choices

/** A choice's face: the current choice in a field, the two arrows on the right; rust rim while the list is open. */
@Composable
fun GMenuFace(text: String, modifier: Modifier = Modifier, open: Boolean = false) {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.sm)
    Row(
        modifier.widthIn(max = 260.dp).heightIn(min = GControlMetrics.compact).then(if (open) Modifier else Modifier.gRaised(shape)).clip(shape)
            .background(if (open) colors.hover.compositeOverSafe(colors.background) else colors.background, shape)
            .border(if (open) 1.5.dp else 1.dp, if (open) colors.accent else colors.hairline, shape)
            .padding(start = 10.dp, end = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(text, style = G.type.body, color = colors.textPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f, fill = false))
        GIcon("chevron.up.chevron.down", size = 10f, weight = FontWeight.SemiBold, color = colors.textDiscret)
    }
}

/** A line of a choice's list: its name, a rust tick if it is the current choice. */
@Composable
fun GMenuRow(title: String, checked: Boolean, onClick: () -> Unit) {
    val colors = G.colors
    Row(
        Modifier.fillMaxWidth().semantics { selected = checked }
            .clickable(role = Role.RadioButton, onClick = onClick)
            .heightIn(min = GControlMetrics.touchTarget).padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(title, style = G.type.body.copy(fontWeight = if (checked) FontWeight.SemiBold else FontWeight.Normal), color = colors.textPrimary,
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        GIcon("checkmark", size = 15f, weight = FontWeight.SemiBold, color = colors.accent, modifier = Modifier.alpha(if (checked) 1f else 0f))
    }
}

/** The current choice in a Gabarit field; the list opens below in a bubble, split by fine lines, the current one ticked. */
@Composable
fun <T> GMenuField(options: List<T>, selection: T, title: (T) -> String, onSelect: (T) -> Unit, modifier: Modifier = Modifier,
                   label: String? = null, enabled: Boolean = true) {
    val colors = G.colors
    var open by remember { mutableStateOf(false) }
    Box(modifier) {
        GMenuFace(title(selection), open = open,
            modifier = Modifier.alpha(if (enabled) 1f else GOpacity.disabled).clip(RoundedCornerShape(GRadius.sm))
                .clickable(enabled = enabled, role = Role.DropdownList) { open = !open }
                .semantics {
                    if (label != null) contentDescription = label
                    stateDescription = title(selection)
                })
        DropdownMenu(open, { open = false }, offset = DpOffset(0.dp, 4.dp), containerColor = G.surfaceOpaque,
            shape = RoundedCornerShape(GRadius.md)) {
            Column(Modifier.widthIn(min = 220.dp)) {
                options.forEachIndexed { index, option ->
                    if (index > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(colors.hairline))
                    GMenuRow(title(option), checked = option == selection) { open = false; onSelect(option) }
                }
            }
        }
    }
}

/** A chip: on the ground with a fine rim; the current one tinted rust. */
@Composable
fun GChip(title: String, selected: Boolean, onClick: () -> Unit) {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.sm)
    Box(
        Modifier.heightIn(min = GControlMetrics.compact).then(if (selected) Modifier.gGlow(colors.accent, shape, 3.dp) else Modifier.gRaised(shape)).clip(shape)
            .background(if (selected) colors.selectedFill.compositeOverSafe(colors.background) else colors.background, shape)
            .border(1.dp, if (selected) colors.accent.copy(alpha = 0.7f) else colors.hairline, shape)
            .semantics { this.selected = selected }
            .clickable(role = Role.RadioButton, onClick = onClick)
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(title, style = G.type.callout.copy(fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium),
            color = if (selected) colors.accentText else colors.textSecondary, maxLines = 1)
    }
}

/** Chips side by side (two to four short options). */
@Composable
fun <T> GChips(options: List<T>, selection: T, title: (T) -> String, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        options.forEach { option -> GChip(title(option), option == selection) { onSelect(option) } }
    }
}

enum class GPickerStyle { Menu, Chips }

/** A titled choice: the title (and its sentence) on the left, the menu or the chips on the right. */
@Composable
fun <T> GPicker(title: String, options: List<T>, selection: T, optionTitle: (T) -> String, onSelect: (T) -> Unit,
                modifier: Modifier = Modifier, style: GPickerStyle = GPickerStyle.Menu, detail: String? = null) {
    val colors = G.colors
    val label = @Composable {
        // Said once, by the control.
        Column(Modifier.clearAndSetSemantics {}, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = G.type.body, color = colors.textPrimary)
            if (detail != null) Text(detail, style = G.type.caption, color = colors.textDiscret)
        }
    }
    when (style) {
        GPickerStyle.Menu -> Row(modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.weight(1f)) { label() }
            GMenuField(options, selection, optionTitle, onSelect, label = title)
        }
        // The chips beside the title while both hold on one line; below it otherwise, rather than a crushed title.
        GPickerStyle.Chips -> GBesideOrBelow(modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget), label) {
            GChips(options, selection, optionTitle, onSelect, Modifier.semantics { contentDescription = title })
        }
    }
}

/** A title and a control: side by side (the control at the end) while the title holds on one line, else stacked. */
@Composable
private fun GBesideOrBelow(modifier: Modifier, title: @Composable () -> Unit, control: @Composable () -> Unit) {
    val gap = with(LocalDensity.current) { 12.dp.roundToPx() }
    val below = with(LocalDensity.current) { 10.dp.roundToPx() }
    Layout({ title(); control() }, modifier) { (t, c), constraints ->
        val free = constraints.copy(minWidth = 0, minHeight = 0)
        val controlPlaced = c.measure(free)
        val beside = t.maxIntrinsicWidth(constraints.maxHeight) + gap + controlPlaced.width <= constraints.maxWidth
        if (beside) {
            val titlePlaced = t.measure(free.copy(maxWidth = constraints.maxWidth - gap - controlPlaced.width))
            val height = maxOf(titlePlaced.height, controlPlaced.height, constraints.minHeight)
            layout(constraints.maxWidth, height) {
                titlePlaced.placeRelative(0, (height - titlePlaced.height) / 2)
                controlPlaced.placeRelative(constraints.maxWidth - controlPlaced.width, (height - controlPlaced.height) / 2)
            }
        } else {
            val titlePlaced = t.measure(free)
            val height = maxOf(titlePlaced.height + below + controlPlaced.height, constraints.minHeight)
            layout(constraints.maxWidth, height) {
                titlePlaced.placeRelative(0, 0)
                controlPlaced.placeRelative(0, titlePlaced.height + below)
            }
        }
    }
}

// MARK: Numbers

/**
 * Gabarit's slider: a thin track, the filled part in rust, a white knob with a rim (rust while dragged). `label`: its
 * name for screen readers; `format`: how they say its value (a percentage by default).
 */
@Composable
fun GSlider(value: Float, onValueChange: (Float) -> Unit, modifier: Modifier = Modifier, range: ClosedFloatingPointRange<Float> = 0f..1f,
            step: Float? = null, label: String? = null, format: ((Float) -> String)? = null, enabled: Boolean = true,
            onValueChangeFinished: (() -> Unit)? = null) {
    val colors = G.colors
    val span = range.endInclusive - range.start
    val fraction = if (span > 0) ((value - range.start) / span).coerceIn(0f, 1f) else 0f
    var dragging by remember { mutableStateOf(false) }
    // The gestures outlive a composition: they call the latest callbacks, not those of the first one.
    val change by rememberUpdatedState(onValueChange)
    val finished by rememberUpdatedState(onValueChangeFinished)
    fun set(f: Float) {
        var next = range.start + f.coerceIn(0f, 1f) * span
        if (step != null && step > 0) next = range.start + ((next - range.start) / step).roundToInt() * step
        change(next.coerceIn(range.start, range.endInclusive))
    }
    val knob = 24.dp
    BoxWithConstraints(
        modifier.fillMaxWidth().widthIn(min = 120.dp).height(GControlMetrics.touchTarget).alpha(if (enabled) 1f else GOpacity.disabled)
            .semantics {
                if (label != null) contentDescription = label
                stateDescription = format?.invoke(value) ?: "${(fraction * 100).roundToInt()} %"
                progressBarRangeInfo = ProgressBarRangeInfo(value, range, if (step != null && step > 0) (span / step).roundToInt() - 1 else 0)
                if (enabled) setProgress { target -> change(target.coerceIn(range.start, range.endInclusive)); finished?.invoke(); true }
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        val run = maxWidth - knob
        val width = with(LocalDensity.current) { run.toPx().coerceAtLeast(1f) }
        val half = with(LocalDensity.current) { (knob / 2).toPx() }
        Box(Modifier.fillMaxWidth().fillMaxHeight()
            .then(if (enabled) Modifier.pointerInput(range, step, width) {
                detectTapGestures { set((it.x - half) / width); finished?.invoke() }
            }.pointerInput(range, step, width) {
                detectHorizontalDragGestures(onDragStart = { dragging = true; set((it.x - half) / width) },
                    onDragEnd = { dragging = false; finished?.invoke() }, onDragCancel = { dragging = false; finished?.invoke() }) { moved, _ ->
                    set((moved.position.x - half) / width)
                }
            } else Modifier),
            contentAlignment = Alignment.CenterStart) {
            Box(Modifier.padding(horizontal = knob / 2).fillMaxWidth().height(4.dp).clip(CircleShape).background(colors.track))
            Box(Modifier.padding(start = knob / 2).width(run * fraction).height(4.dp).clip(CircleShape).background(colors.accent))
            Box(Modifier.offset(x = run * fraction).size(knob).shadow(1.5.dp, CircleShape)
                .background(Color.White, CircleShape)
                .border(1.dp, if (dragging) colors.accent else colors.border.copy(alpha = 0.5f), CircleShape))
        }
    }
}

/** A number to raise or lower: the title, then two buttons on either side of the value, in a field. Said as one value. */
@Composable
fun GStepper(title: String, value: Int, onValueChange: (Int) -> Unit, range: IntRange, modifier: Modifier = Modifier,
             decrease: String = "−", increase: String = "+") {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.sm)
    Row(
        modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget)
            .semantics(mergeDescendants = true) {
                contentDescription = title
                stateDescription = value.toString()
                progressBarRangeInfo = ProgressBarRangeInfo(value.toFloat(), range.first.toFloat()..range.last.toFloat(), range.last - range.first - 1)
                setProgress { target -> onValueChange(target.roundToInt().coerceIn(range)); true }
            },
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(title, style = G.type.body, color = colors.textPrimary, modifier = Modifier.weight(1f))
        Row(Modifier.height(GControlMetrics.compact).gRaised(shape).clip(shape).background(colors.background, shape).border(1.dp, colors.hairline, shape),
            verticalAlignment = Alignment.CenterVertically) {
            StepperButton("minus", decrease, value > range.first) { onValueChange((value - 1).coerceIn(range)) }
            Box(Modifier.width(1.dp).fillMaxHeight().background(colors.hairline))
            Text(value.toString(), style = G.type.body.copy(fontFeatureSettings = "tnum"), color = colors.textPrimary,
                modifier = Modifier.widthIn(min = 40.dp).padding(horizontal = 6.dp), maxLines = 1,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Box(Modifier.width(1.dp).fillMaxHeight().background(colors.hairline))
            StepperButton("plus", increase, value < range.last) { onValueChange((value + 1).coerceIn(range)) }
        }
    }
}

@Composable
private fun StepperButton(symbol: String, label: String, enabled: Boolean, onClick: () -> Unit) {
    val colors = G.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Box(Modifier.width(GControlMetrics.compact + 8.dp).fillMaxHeight().background(if (pressed) colors.track else Color.Transparent)
        .alpha(if (enabled) 1f else GOpacity.disabled)
        .clickable(interaction, indication = null, enabled = enabled, role = Role.Button, onClickLabel = label, onClick = onClick),
        contentAlignment = Alignment.Center) {
        GIcon(symbol, size = 11f, weight = FontWeight.SemiBold, color = colors.textPrimary)
    }
}

/** `this` laid on `under`, as one solid colour (a translucent tint on a ground). */
internal fun Color.compositeOverSafe(under: Color): Color = if (alpha >= 1f || under.alpha == 0f) this else compositeOver(under)
