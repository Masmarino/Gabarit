package com.masmarino.gabarit

import androidx.compose.foundation.background
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
        if (title != null) {
            Text(title, style = G.type.headline, color = colors.textPrimary,
                modifier = Modifier.padding(horizontal = 4.dp).semantics { heading() })
        }
        Column(Modifier.fillMaxWidth().gSurface(RoundedCornerShape(GRadius.lg), colors.surface, colors.hairline).clip(RoundedCornerShape(GRadius.lg))) {
            rows.forEachIndexed { index, row ->
                if (index > 0) Box(Modifier.padding(start = 16.dp).fillMaxWidth().height(1.dp).background(colors.hairline))
                row()
            }
        }
        if (footer != null) Text(footer, style = G.type.footnote, color = colors.textDiscret, modifier = Modifier.padding(horizontal = 4.dp))
    }
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
        Modifier.fillMaxWidth().heightIn(min = 40.dp).clip(shape).background(if (selected) colors.selectedFill else Color.Transparent, shape)
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
