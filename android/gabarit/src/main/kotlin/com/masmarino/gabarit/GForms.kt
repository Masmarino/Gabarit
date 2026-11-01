package com.masmarino.gabarit

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.windowInsetsBottomHeight
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

// Gabarit's forms, as on the iPhone: a page's title, sections as cards with rows of a constant height split by fine
// lines, the sentence under a section, the side column's sections, underlined tabs.

/** A form's margins and spacing. */
object GFormMetrics {
    val pageMargin = 20.dp
    val sectionSpacing = 28.dp
    val rowHeight = GControlMetrics.touchTarget
    /** A card's row: 16 on the sides, 10 above and below. */
    val rowPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
}

/** Inside a form's card: its fields lose their rim at rest (the card is their frame). Set by the cards of Gabarit's forms. */
val LocalGFormCard = compositionLocalOf { false }

/**
 * Rests on the page, like a card: a soft shadow, the light on the top edge, shade on the bottom one. Before the ground it
 * rests with (`Modifier.gCardDepth(shape).gSurface(...)`); the light and the shade are drawn over what it holds.
 */
@Composable
fun Modifier.gCardDepth(shape: Shape): Modifier {
    val light = G.colors.reliefHighlight
    val shade = G.colors.reliefShade
    return this.gResting(2.dp, shape).drawWithCache {
        val outline = Path().apply { addOutline(shape.createOutline(size, layoutDirection, this@drawWithCache)) }
        val edge = 1.5.dp.toPx()
        val top = Brush.verticalGradient(listOf(light, light.copy(alpha = 0f)), endY = edge)
        val bottom = Brush.verticalGradient(listOf(shade.copy(alpha = 0f), shade), startY = size.height - edge, endY = size.height)
        onDrawWithContent {
            drawContent()
            clipPath(outline) {
                drawRect(top, size = Size(size.width, edge))
                drawRect(bottom, Offset(0f, size.height - edge), Size(size.width, edge))
            }
        }
    }
}

/** A form's card: the surface, a fine rim, the large radius; what it holds is cut to its corners. */
@Composable
fun Modifier.gCard(): Modifier {
    val shape = RoundedCornerShape(GRadius.lg)
    return this.gCardDepth(shape).gSurface(shape, G.colors.surface, G.colors.hairline).clip(shape)
}

/** The fine line under a card's row, inset 16 from the leading edge (`show` false: nothing). */
@Composable
fun Modifier.gRowDivider(show: Boolean = true): Modifier {
    if (!show) return this
    val color = G.colors.hairline
    return drawBehind {
        val line = 1.dp.toPx()
        val inset = 16.dp.toPx()
        val start = if (layoutDirection == LayoutDirection.Ltr) inset else 0f
        drawRect(color, Offset(start, size.height - line), Size(size.width - inset, line))
    }
}

/** A page's title: large, the sentence that says what it is for more discreet below. */
@Composable
fun GPageTitle(title: String, summary: String? = null, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title, style = G.type.largeTitle, color = G.colors.textPrimary, modifier = Modifier.semantics { heading() })
        if (summary != null) Text(summary, style = G.type.body, color = G.colors.textDiscret)
    }
}

/**
 * A form's section: its title, its rows in a card split by fine lines (inset 16 from the leading edge), its sentence
 * discreet below. Each row is laid by `GRow` or given as it is.
 */
@Composable
fun GFormSection(title: String? = null, footer: String? = null, modifier: Modifier = Modifier, rows: List<@Composable () -> Unit>) {
    val colors = G.colors
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (title != null) GFormSectionTitle(title)
        Column(Modifier.fillMaxWidth().gCard()) {
            CompositionLocalProvider(LocalGFormCard provides true) {
                rows.forEachIndexed { index, row ->
                    if (index > 0) Box(Modifier.padding(start = 16.dp).fillMaxWidth().height(1.dp).background(colors.hairline))
                    row()
                }
            }
        }
        if (footer != null) Text(footer, style = G.type.footnote, color = colors.textDiscret, modifier = Modifier.padding(horizontal = 4.dp))
    }
}

/**
 * A form's section whose rows are laid as they come (`GFormRow`, `GToggleRow`…): each row draws its own line
 * (`divider`), the last one none.
 */
@Composable
fun GFormSection(title: String? = null, footer: String? = null, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (title != null) GFormSectionTitle(title)
        Column(Modifier.fillMaxWidth().gCard()) { CompositionLocalProvider(LocalGFormCard provides true) { content() } }
        if (footer != null) Text(footer, style = G.type.footnote, color = G.colors.textDiscret, modifier = Modifier.padding(horizontal = 4.dp))
    }
}

/** A section's title, above its card (a heading for screen readers). */
@Composable
fun GFormSectionTitle(title: String, modifier: Modifier = Modifier) {
    Text(title, style = G.type.headline, color = G.colors.textPrimary, modifier = modifier.padding(horizontal = 4.dp).semantics { heading() })
}

/**
 * A card's row: an icon (the Mac's name), its title and detail, what sits on the right (`trailing`); red if it
 * destroys. Touched if `onClick`; `divider`: the fine line under it.
 */
@Composable
fun GFormRow(
    title: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    icon: String? = null,
    destructive: Boolean = false,
    divider: Boolean = false,
    enabled: Boolean = true,
    onClick: (() -> Unit)? = null,
    trailing: @Composable RowScope.() -> Unit = {},
) {
    val colors = G.colors
    val tint = if (destructive) colors.errorText else colors.textPrimary
    Row(
        modifier.fillMaxWidth().gRowDivider(divider).alpha(if (enabled) 1f else GOpacity.disabled)
            .then(if (onClick != null) Modifier.clickable(enabled = enabled, role = Role.Button, onClick = onClick) else Modifier)
            .heightIn(min = GFormMetrics.rowHeight).padding(GFormMetrics.rowPadding),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (icon != null) Box(Modifier.size(24.dp), contentAlignment = Alignment.Center) {
            GIcon(icon, size = 17f, color = if (destructive) tint else colors.textSecondary)
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = G.type.body, color = tint)
            if (detail != null) Text(detail, style = G.type.footnote, color = colors.textDiscret)
        }
        CompositionLocalProvider(LocalContentColor provides colors.textSecondary) {
            ProvideTextStyle(G.type.body.copy(color = colors.textSecondary)) { trailing() }
        }
    }
}

/** A choice among a card's rows (an inline picker): its name, the rust tick on the right of the current one. */
@Composable
fun GChoiceRow(title: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier, divider: Boolean = false) {
    val colors = G.colors
    Row(
        modifier.fillMaxWidth().gRowDivider(divider).semantics { this.selected = selected }
            .clickable(role = Role.RadioButton, onClick = onClick)
            .heightIn(min = GFormMetrics.rowHeight).padding(GFormMetrics.rowPadding),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = G.type.body, color = colors.textPrimary, modifier = Modifier.weight(1f))
        if (selected) GIcon("checkmark", size = 15f, weight = FontWeight.SemiBold, color = colors.accent)
    }
}

/** A settings section's coloured tile (as on the iPhone): a gradient of its colour, the icon in white. */
@Composable
fun GIconTile(icon: String, color: Color, size: Dp = 30.dp) {
    val shape = RoundedCornerShape(size * 0.28f)
    Box(
        Modifier.size(size).background(Brush.linearGradient(listOf(color.copy(alpha = 0.95f), color.copy(alpha = 0.6f))), shape)
            .border(0.6.dp, Color.White.copy(alpha = 0.3f), shape),
        contentAlignment = Alignment.Center,
    ) { GIcon(icon, null, Modifier.size(size * 0.55f), tint = Color.White) }
}

// MARK: Long forms

/** A form's section as one item of a lazy list. */
fun LazyListScope.gFormSection(title: String? = null, footer: String? = null, key: Any? = title, content: @Composable ColumnScope.() -> Unit) {
    item(key = key) { GFormSection(title, footer, content = content) }
}

/**
 * A section whose rows are each an item of the lazy list: only the rows on screen are composed (a long list of
 * members). The title is an item of its own (`gap` above it); each row carries its part of the card (the top corners
 * on the first, the bottom ones on the last). For a list with no spacing between its items.
 */
fun LazyListScope.gFormSectionRows(
    title: String?,
    key: Any,
    count: Int,
    rowKey: (Int) -> Any,
    gap: Dp = GFormMetrics.sectionSpacing,
    row: @Composable ColumnScope.(Int) -> Unit,
) {
    item(key = key) {
        Column(Modifier.fillMaxWidth().padding(top = gap, bottom = 8.dp)) { if (title != null) GFormSectionTitle(title) }
    }
    items(count, key = rowKey) { index -> GFormCardSlice(first = index == 0, last = index == count - 1) { row(index) } }
}

/**
 * A card's slice, for a card laid row by row: the surface and its fine rim (the sides; the top on the first, the bottom
 * on the last), as `gCard`.
 */
@Composable
fun GFormCardSlice(first: Boolean, last: Boolean, content: @Composable ColumnScope.() -> Unit) {
    val colors = G.colors
    val r = GRadius.lg
    val shape = RoundedCornerShape(topStart = if (first) r else 0.dp, topEnd = if (first) r else 0.dp,
        bottomStart = if (last) r else 0.dp, bottomEnd = if (last) r else 0.dp)
    Column(Modifier.fillMaxWidth().clip(shape).background(colors.surface, shape).drawWithContent {
        drawContent()
        // The whole card's rim, drawn beyond the slice and cut to it: only the sides stay between two rows.
        val line = 1.dp.toPx()
        val radius = r.toPx()
        val top = if (first) 0f else -radius * 2
        val bottom = if (last) size.height else size.height + radius * 2
        clipRect {
            drawRoundRect(colors.hairline, topLeft = Offset(line / 2, top + line / 2), size = Size(size.width - line, bottom - top - line),
                cornerRadius = CornerRadius(radius), style = Stroke(line))
        }
    }) { CompositionLocalProvider(LocalGFormCard provides true) { content() } }
}

/**
 * The room of Android's navigation bar (buttons or gesture), at the bottom of a page that scrolls under it: the last
 * item can rise above it.
 */
@Composable
fun GNavigationBarSpacer(modifier: Modifier = Modifier) {
    Spacer(modifier.windowInsetsBottomHeight(WindowInsets.navigationBars))
}

/** The room of Android's navigation bar, as a lazy list's last item. */
fun LazyListScope.gNavigationBarSpace() {
    item(key = "gabarit.navigationBar", contentType = "gabarit.navigationBar") { GNavigationBarSpacer() }
}

/** A row of a form's card: what it holds, 44 high at least, 16 on the sides. */
@Composable
fun GRow(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(modifier.fillMaxWidth().heightIn(min = GFormMetrics.rowHeight).padding(horizontal = 16.dp, vertical = 8.dp),
        contentAlignment = Alignment.CenterStart) { content() }
}

/** A value and its title: the title on the left, the value on the right, more discreet (said together). */
@Composable
fun GValueRow(title: String, value: String) {
    GRow(Modifier.semantics(mergeDescendants = true) {}) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = G.type.body, color = G.colors.textPrimary, modifier = Modifier.weight(1f))
            Text(value, style = G.type.body.copy(fontFeatureSettings = "tnum"), color = G.colors.textSecondary)
        }
    }
}

/** A card's clickable row: its text in rust (red if it destroys), full width; the track's grey while pressed. */
@Composable
fun GRowButton(title: String, onClick: () -> Unit, destructive: Boolean = false, enabled: Boolean = true) {
    val colors = G.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Box(Modifier.fillMaxWidth().heightIn(min = GFormMetrics.rowHeight).background(if (pressed) colors.rowHover else Color.Transparent)
        .alpha(if (enabled) 1f else GOpacity.disabled)
        .clickable(interaction, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
        .padding(horizontal = 16.dp, vertical = 8.dp), contentAlignment = Alignment.CenterStart) {
        Text(title, style = G.type.body, color = if (destructive) colors.errorText else colors.accentText)
    }
}

/** A form's buttons, side by side on the right (`leading`: on the left). */
@Composable
fun GFormButtons(leading: Boolean = false, content: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, if (leading) Alignment.Start else Alignment.End)) { content() }
}

/** A form page: the title, then its sections, scrolling, on the page's ground. */
@Composable
fun GForm(title: String, summary: String? = null, modifier: Modifier = Modifier, sections: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxSize().gPageGround().verticalScroll(rememberScrollState())
        .padding(horizontal = GFormMetrics.pageMargin).padding(top = 24.dp, bottom = 40.dp),
        verticalArrangement = Arrangement.spacedBy(GFormMetrics.sectionSpacing)) {
        GPageTitle(title, summary)
        sections()
    }
}

// MARK: Side column, tabs

/**
 * A section in a side column: a monochrome icon and its name, 40 high; the chosen one on a soft ground, in rust.
 * `warns`: a warning dot; `detail`: a number or a value, discreet on the right.
 */
@Composable
fun GSidebarRow(title: String, icon: String, selected: Boolean, onClick: () -> Unit, detail: String? = null, warns: Boolean = false,
                warning: String = "Needs attention") {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.md)
    val spoken = listOfNotNull(title, detail, if (warns) warning else null).joinToString(", ")
    Row(
        Modifier.fillMaxWidth().heightIn(min = 40.dp).then(if (selected) Modifier.gGlow(colors.accent, shape, 3.dp) else Modifier).clip(shape).background(if (selected) colors.selectedFill else Color.Transparent, shape)
            .clickable(role = Role.Tab, onClick = onClick).padding(horizontal = 10.dp)
            .clearAndSetSemantics { contentDescription = spoken; this.selected = selected },
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(Modifier.size(22.dp), contentAlignment = Alignment.Center) {
            GIcon(icon, size = 17f, weight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                color = if (selected) colors.accent else colors.textDiscret)
        }
        Text(title, style = G.type.body.copy(fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal),
            color = if (selected) colors.accentText else colors.textPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f))
        if (detail != null) {
            Text(detail, style = G.type.callout.copy(fontFeatureSettings = "tnum"), color = if (selected) colors.accentText else colors.textDiscret)
        }
        if (warns) Box(Modifier.size(6.dp).background(colors.warning, CircleShape))
    }
}

/** Underlined tabs: the text, a rust line under the current one, a fine line under them all. */
@Composable
fun <T> GNavTabs(tabs: List<T>, selection: T, title: (T) -> String, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    val colors = G.colors
    Row(modifier.fillMaxWidth().drawBehind {
        drawLine(colors.hairline, Offset(0f, size.height - 0.5f), Offset(size.width, size.height - 0.5f), 1.dp.toPx())
    }, horizontalArrangement = Arrangement.spacedBy(20.dp)) {
        tabs.forEach { tab ->
            val current = tab == selection
            Box(Modifier.heightIn(min = GControlMetrics.touchTarget).semantics { selected = current }
                .clickable(role = Role.Tab) { onSelect(tab) }
                .drawBehind { if (current) drawRect(colors.accent, Offset(0f, size.height - 2.dp.toPx()), androidx.compose.ui.geometry.Size(size.width, 2.dp.toPx())) }
                .padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                Text(title(tab), style = G.type.body.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium),
                    color = if (current) colors.textPrimary else colors.textSecondary)
            }
        }
        Spacer(Modifier.weight(1f))
    }
}
