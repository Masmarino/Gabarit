package com.masmarino.gabarit

import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.statusBars
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.SheetValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.graphics.luminance
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.zIndex
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.dismiss
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlin.math.roundToInt

// Gabarit's frame for Compose, as on the iPhone and the iPad: the bars (a band, the rail), the bottom tab bar, sheets,
// bubble menus, the side drawer and the quick search. 4.0: the bars lie on the ground, transparent, in the ink; what
// floats on it (the tab bar, a floating header, its round buttons) is liquid glass. 3.x's graphite frame stays, asked
// for: `GFrameStyle.Graphite` (a bar's `style`, or `LocalGFrameStyle` for a whole screen).

/** How the bars are drawn: on the ground (4.0's default), or in 3.x's graphite frame (graphite 950, the same in both appearances). */
enum class GFrameStyle { Ground, Graphite }

/** The bars' style for what is below (`GFrameStyle.Ground` by default). */
val LocalGFrameStyle = compositionLocalOf { GFrameStyle.Ground }

/** A count on an icon (a tab, a rail item): "99+" beyond 99. */
fun gBadgeText(count: Int): String = if (count > 99) "99+" else count.toString()

/** In a sheet: its header is on the page's grey, not on the dark frame (what tells a sheet from a page). Set by `GBottomSheet`. */
val LocalGInSheet = compositionLocalOf { false }

/** The light on the frame's dark bars: a soft sheen from above. */
private val gFrameSheen get() = Brush.verticalGradient(listOf(GPalette.graphite900, GFrameColor.ground))

// MARK: Bars

/** A tab of the bottom bar: its title, its icon (the Mac's name) or the app's own image (`image`, drawn in the tab's colour), a count. */
data class GTab(val id: String, val title: String, val icon: String = "", val badge: Int = 0, @param:DrawableRes val image: Int? = null)

/**
 * Gabarit's bottom bar. 4.0 (`GFrameStyle.Ground`): a pill of liquid glass floating over the page, above the system's
 * navigation bar, the current tab on a lighter pill, in rust; `backdrop`: what scrolls under it, blurred with the
 * ground. `GFrameStyle.Graphite`: 3.x's bar, flat on the surface, a fine line above, the current tab underlined from the top.
 */
@Composable
fun GTabBar(tabs: List<GTab>, selection: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier,
            style: GFrameStyle = LocalGFrameStyle.current, backdrop: GBackdrop? = null) {
    if (style == GFrameStyle.Ground) {
        GroundTabBar(tabs, selection, onSelect, modifier, backdrop)
        return
    }
    val colors = G.colors
    // It casts a shadow on the page above it.
    Row(modifier.fillMaxWidth().zIndex(1f).shadow(6.dp).background(colors.surface).drawBehind {
        drawLine(colors.hairline, Offset(0f, 0.5f), Offset(size.width, 0.5f), 1.dp.toPx())
    }.windowInsetsPadding(WindowInsets.navigationBars)) {
        tabs.forEach { tab ->
            val current = tab.id == selection
            val tint = if (current) colors.accentText else colors.textSecondary
            Column(
                Modifier.weight(1f).heightIn(min = 54.dp)
                    .clickable(role = Role.Tab) { onSelect(tab.id) }
                    .clearAndSetSemantics {
                        contentDescription = tab.title
                        selected = current
                        if (tab.badge > 0) stateDescription = gBadgeText(tab.badge)
                    }
                    .drawBehind {
                        if (current) {
                            val inset = 18.dp.toPx()
                            // Its light falls on the tab, from the line above.
                            drawRect(Brush.verticalGradient(listOf(colors.accent.copy(alpha = 0.16f), colors.accent.copy(alpha = 0f)), endY = 20.dp.toPx()),
                                Offset(inset, 0f), Size(size.width - 2 * inset, 20.dp.toPx()))
                            drawRect(colors.accent, Offset(inset, 0f), Size(size.width - 2 * inset, 2.dp.toPx()))
                        }
                    },
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterVertically),
            ) {
                Box {
                    if (tab.image != null) Image(painterResource(tab.image), null, Modifier.size(24.dp), colorFilter = ColorFilter.tint(tint))
                    else GIcon(tab.icon, size = 20f, weight = if (current) FontWeight.SemiBold else FontWeight.Normal, color = tint)
                    if (tab.badge > 0) {
                        Text(gBadgeText(tab.badge), style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold, fontFeatureSettings = "tnum"),
                            color = colors.textPrimary, modifier = Modifier.align(Alignment.TopEnd).offset(16.dp, (-6).dp)
                                .background(colors.track, RoundedCornerShape(GRadius.pill)).padding(horizontal = 5.dp, vertical = 1.dp))
                    }
                }
                Text(tab.title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium), color = tint,
                    maxLines = 1)
            }
        }
    }
}

/**
 * The band on top of a screen, under the status bar (`statusBar` false: the room is someone else's): the back arrow if
 * `back`, `leading` (a logo, a conversation's face), the title (`subtitle` discreet below) or `center` in the middle,
 * then `trailing`. 4.0 (`GFrameStyle.Ground`): transparent on the ground, in the ink, its buttons round liquid glass;
 * `floating`: the whole band a pill of liquid glass (a conversation's header). `GFrameStyle.Graphite`: 3.x's dark band,
 * the same in both appearances. In a sheet (`LocalGInSheet`): on the sheet, as it is.
 */
@Composable
fun GTopBar(
    title: String? = null,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    back: (() -> Unit)? = null,
    backTitle: String = "Back",
    statusBar: Boolean = true,
    leading: @Composable RowScope.() -> Unit = {},
    center: (@Composable () -> Unit)? = null,
    trailing: @Composable RowScope.() -> Unit = {},
    style: GFrameStyle = LocalGFrameStyle.current,
    floating: Boolean = false,
) {
    val inSheet = LocalGInSheet.current
    if (!inSheet && style == GFrameStyle.Ground) {
        GroundTopBar(title, modifier, subtitle, back, backTitle, statusBar, leading, center, trailing, floating)
        return
    }
    val bar = @Composable {
        val text = if (inSheet) G.colors.textPrimary else GFrameColor.text
        CompositionLocalProvider(LocalContentColor provides text, LocalGFrameStyle provides GFrameStyle.Graphite) {
            Box(modifier.fillMaxWidth().then(if (inSheet) Modifier else Modifier.zIndex(1f).shadow(6.dp).background(gFrameSheen))
                .then(if (statusBar) Modifier.windowInsetsPadding(WindowInsets.statusBars) else Modifier)
                .heightIn(min = 56.dp).padding(horizontal = 4.dp), contentAlignment = Alignment.CenterStart) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    if (back != null) GFrameButton("chevron.left", backTitle, onClick = back) else Spacer(Modifier.width(8.dp))
                    leading()
                    if (title != null && center == null) {
                        Column(Modifier.weight(1f).padding(horizontal = 8.dp).semantics(mergeDescendants = true) { heading() }) {
                            Text(title, style = G.type.headline, color = text, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            if (!subtitle.isNullOrEmpty()) {
                                Text(subtitle, style = G.type.caption, color = if (inSheet) G.colors.textDiscret else GFrameColor.textDiscret, maxLines = 1)
                            }
                        }
                    } else Spacer(Modifier.weight(1f))
                    trailing()
                }
                if (center != null) Box(Modifier.align(Alignment.Center)) { center() }
            }
        }
    }
    if (inSheet) bar() else GScheme(dark = true) { bar() }
}

/**
 * A round icon button of a bar (a band's action): `title` is what screen readers say. 4.0, on the ground: a circle of
 * liquid glass (plain inside liquid glass, `LocalGOnLiquid`), in the ink; on 3.x's graphite frame or in a sheet, as before.
 */
@Composable
fun GFrameButton(icon: String, title: String, isOn: Boolean = false, onClick: () -> Unit) {
    val inSheet = LocalGInSheet.current
    if (!inSheet && LocalGFrameStyle.current == GFrameStyle.Ground) {
        GroundFrameButton(icon, title, isOn, onClick)
        return
    }
    val selected = if (inSheet) G.colors.selectedFill else GFrameColor.selected
    val tint = when {
        isOn -> if (inSheet) G.colors.accentText else GFrameColor.accent
        inSheet -> G.colors.textSecondary
        else -> GFrameColor.textSecondary
    }
    Box(Modifier.size(GControlMetrics.touchTarget).clip(CircleShape).background(if (isOn) selected else Color.Transparent)
        .clickable(role = Role.Button, onClick = onClick).semantics { contentDescription = title }, contentAlignment = Alignment.Center) {
        GIcon(icon, size = 17f, color = tint)
    }
}

/**
 * A page of the rail (a large screen, a tablet): the icon and its name; `badge`: a count on the icon. 4.0, on the
 * ground: the current page on liquid glass, its icon in rust; 3.x's graphite rail: in rust, on a slight ground, with a
 * line on the left.
 */
@Composable
fun GRailItem(title: String, icon: String, current: Boolean, onClick: () -> Unit, badge: Int = 0) {
    if (LocalGFrameStyle.current == GFrameStyle.Ground) {
        GroundRailItem(title, icon, current, onClick, badge)
        return
    }
    val tint = if (current) GFrameColor.accent else GFrameColor.textDiscret
    Column(
        Modifier.fillMaxWidth().heightIn(min = 52.dp).clip(RoundedCornerShape(GRadius.row))
            .background(if (current) GFrameColor.selected else Color.Transparent)
            .drawBehind { if (current) drawRect(GFrameColor.accent, Offset(0f, 6.dp.toPx()), Size(2.dp.toPx(), size.height - 12.dp.toPx())) }
            .clickable(role = Role.Tab, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = title
                selected = current
                if (badge > 0) stateDescription = gBadgeText(badge)
            },
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterVertically),
    ) {
        Box {
            GIcon(icon, size = 17f, weight = if (current) FontWeight.SemiBold else FontWeight.Normal, color = tint)
            if (badge > 0) {
                Text(gBadgeText(badge), style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold, fontFeatureSettings = "tnum"),
                    color = GFrameColor.text, modifier = Modifier.align(Alignment.TopEnd).offset(14.dp, (-6).dp)
                        .background(GFrameColor.rim, RoundedCornerShape(GRadius.pill)).padding(horizontal = 4.dp, vertical = 1.dp))
            }
        }
        Text(title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium), color = tint, maxLines = 1)
    }
}

/**
 * The rail on the leading side (a large screen): its pages, from the top. 4.0: on the ground, without a ground of its
 * own; `GFrameStyle.Graphite`: 3.x's dark rail.
 */
@Composable
fun GRail(modifier: Modifier = Modifier, style: GFrameStyle = LocalGFrameStyle.current, content: @Composable ColumnScope.() -> Unit) {
    if (style == GFrameStyle.Ground) {
        CompositionLocalProvider(LocalGFrameStyle provides GFrameStyle.Ground) {
            Column(modifier.width(84.dp).fillMaxHeight().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp), content = content)
        }
        return
    }
    GScheme(dark = true) {
        CompositionLocalProvider(LocalGFrameStyle provides GFrameStyle.Graphite) {
            Column(modifier.width(92.dp).fillMaxHeight().zIndex(1f).shadow(6.dp).background(gFrameSheen).padding(horizontal = 6.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp), content = content)
        }
    }
}

/**
 * The band under a settings page's bar: the icon, the title and the sentence that says what the page is for.
 * `accessory`: on the right. 4.0: on the ground, the icon on thin glass, in the ink; `GFrameStyle.Graphite`: 3.x's dark
 * band, the icon ringed by a fine line (on the page's grey in a sheet).
 */
@Composable
fun GPageBand(icon: String, title: String, summary: String, accessory: @Composable () -> Unit = {},
              style: GFrameStyle = LocalGFrameStyle.current) {
    val inSheet = LocalGInSheet.current
    if (!inSheet && style == GFrameStyle.Ground) {
        val colors = G.colors
        Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 18.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(Modifier.size(48.dp).gGlass(GGlassDensity.Thin, RoundedCornerShape(GRadius.row), GGlassShadow.Near), contentAlignment = Alignment.Center) {
                GIcon(icon, size = 22f, color = colors.ink)
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, style = G.type.title2, color = colors.ink, modifier = Modifier.semantics { heading() })
                Text(summary, style = G.type.subheadline, color = colors.ink2)
            }
            accessory()
        }
        return
    }
    val text = if (inSheet) G.colors.textPrimary else GFrameColor.text
    Row(Modifier.fillMaxWidth().then(if (inSheet) Modifier else Modifier.zIndex(1f).shadow(6.dp).background(gFrameSheen))
        .padding(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 18.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        Box(Modifier.size(48.dp).border(1.dp, if (inSheet) G.colors.hairline else GFrameColor.rim, RoundedCornerShape(GRadius.row)),
            contentAlignment = Alignment.Center) {
            GIcon(icon, size = 22f, color = text)
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = G.type.title2, color = text, modifier = Modifier.semantics { heading() })
            Text(summary, style = G.type.subheadline, color = if (inSheet) G.colors.textDiscret else GFrameColor.textSecondary)
        }
        accessory()
    }
}

// MARK: Menus

/** A bubble menu's line: an icon and its name; red if it destroys; `checked`: a rust tick on the right (always room). */
@Composable
fun GMenuItem(title: String, icon: String, onClick: () -> Unit, destructive: Boolean = false, checked: Boolean? = null) {
    val colors = G.colors
    val tint = if (destructive) colors.errorText else colors.textPrimary
    Row(Modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget).semantics { if (checked != null) selected = checked }
        .clickable(role = Role.Button, onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.width(20.dp), contentAlignment = Alignment.Center) { GIcon(icon, size = 15f, color = tint) }
        Text(title, style = G.type.body, color = tint, modifier = Modifier.weight(1f))
        if (checked != null) {
            Box(Modifier.width(16.dp)) { if (checked) GIcon("checkmark", size = 15f, weight = FontWeight.SemiBold, color = colors.accent) }
        }
    }
}

/**
 * A bubble menu (the glass's radius, as what contains): liquid glass made dense (a menu is another window: nothing of the page can be blurred under it), its
 * edge of light, a short shadow, a large radius; its lines below the place it opens from.
 */
@Composable
fun GDropdownMenu(expanded: Boolean, onDismiss: () -> Unit, modifier: Modifier = Modifier, offset: DpOffset = DpOffset(0.dp, 4.dp),
                  content: @Composable ColumnScope.() -> Unit) {
    DropdownMenu(expanded, onDismiss, modifier, offset = offset, shape = RoundedCornerShape(GRadius.glass), containerColor = G.surfaceOpaque,
        tonalElevation = 0.dp, shadowElevation = 8.dp, border = gLiquidBorder(), content = content)
}

/**
 * The edge of light of what floats in a window of its own (a menu, a dialog): up and down, never across, bright at the
 * top, out by the middle, back at the bottom; a true rim with high contrast.
 */
@Composable
internal fun gLiquidBorder(): BorderStroke {
    val colors = G.colors
    if (G.highContrast) return BorderStroke(1.dp, colors.border)
    // Light on light shows nothing: a light ground's menu keeps a hint of the discreet ink at its edge.
    val soft = if (G.isDark) Color.Transparent else colors.ink.copy(alpha = 0.08f)
    return BorderStroke(1.dp, Brush.verticalGradient(0f to colors.liquidRimTop, 0.5f to soft, 1f to colors.liquidRimBottom))
}

/** A bubble menu's lines (4.0: no line between them), on the menu's ground: put it in a `GDropdownMenu`. */
@Composable
fun GMenu(items: List<@Composable () -> Unit>) {
    Column(Modifier.widthIn(min = 240.dp).background(G.surfaceOpaque).padding(vertical = 4.dp)) {
        items.forEach { item -> item() }
    }
}

// MARK: Sheets

/**
 * A sheet's title: large, its sentence below, the back arrow before it if `back`, `actions` then the cross on the right
 * (no cross without `dismiss`).
 */
@Composable
fun GSheetTitle(title: String, summary: String? = null, closeTitle: String = "Close", backTitle: String = "Back", back: (() -> Unit)? = null,
                actions: @Composable RowScope.() -> Unit = {}, modifier: Modifier = Modifier, dismiss: (() -> Unit)? = null) {
    val colors = G.colors
    Row(modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        if (back != null) {
            Box(Modifier.size(GControlMetrics.touchTarget).clickable(role = Role.Button, onClick = back).semantics { contentDescription = backTitle },
                contentAlignment = Alignment.Center) {
                Box(Modifier.size(30.dp).then(if (G.grounds == null) Modifier.gControlGlass(CircleShape, false) else Modifier.background(colors.track, CircleShape)),
                    contentAlignment = Alignment.Center) {
                    GIcon("chevron.left", size = 14f, weight = FontWeight.SemiBold, color = colors.textSecondary)
                }
            }
        }
        Column(Modifier.weight(1f).padding(top = 6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = G.type.title2, color = colors.textPrimary, maxLines = 2, modifier = Modifier.semantics { heading() })
            if (!summary.isNullOrEmpty()) Text(summary, style = G.type.callout, color = colors.textDiscret)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            CompositionLocalProvider(LocalContentColor provides colors.textPrimary) { actions() }
            if (dismiss != null) GCloseButton(closeTitle, onClick = dismiss)
        }
    }
}

/**
 * A sheet from the bottom with what it holds as it is. 4.0: thick content glass (a sheet carries a form: it is content)
 * on the ground, the glass's radius on top; `ground`: an opaque colour of its own instead (3.x: `G.backgroundOpaque`,
 * the large radius). `handle`: the small bar to pull it by; `halfway`: it may stop half open. The system's back gesture
 * and a swipe down close it; `dismissible` false: neither a swipe nor a touch beside it does (while something is being edited).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GBottomSheet(onDismiss: () -> Unit, modifier: Modifier = Modifier, ground: Color = Color.Unspecified, handle: Boolean = false,
                 halfway: Boolean = false, dismissible: Boolean = true,
                 contentWindowInsets: @Composable () -> WindowInsets = { BottomSheetDefaults.windowInsets },
                 content: @Composable ColumnScope.() -> Unit) {
    val stays by rememberUpdatedState(!dismissible)
    val state = rememberModalBottomSheetState(skipPartiallyExpanded = !halfway, confirmValueChange = { !stays || it != SheetValue.Hidden })
    val glass = ground == Color.Unspecified
    val radius = GRadius.glass
    val shape = RoundedCornerShape(topStart = radius, topEnd = radius)
    val rim = if (glass) G.colors.ink3 else if (ground.luminance() < 0.2f) GFrameColor.rim else G.colors.border
    ModalBottomSheet(onDismissRequest = onDismiss,
        modifier = if (glass) modifier.gGlass(GGlassDensity.Thick, shape, GGlassShadow.None) else modifier, sheetState = state,
        containerColor = if (glass) Color.Transparent else ground,
        contentColor = G.colors.textPrimary, tonalElevation = 0.dp, shape = shape,
        contentWindowInsets = contentWindowInsets, sheetGesturesEnabled = dismissible,
        dragHandle = if (!handle) null else ({
            Box(Modifier.padding(top = 10.dp, bottom = 6.dp).size(width = 36.dp, height = 5.dp).background(rim, RoundedCornerShape(GRadius.pill)))
        })) { CompositionLocalProvider(LocalGInSheet provides true) { content() } }
}

/**
 * A sheet from the bottom: Gabarit's title and cross on top, then the content on the page's ground. The system's back
 * gesture and a swipe down close it too.
 */
@Composable
fun GSheet(title: String, onDismiss: () -> Unit, summary: String? = null, closeTitle: String = "Close", content: @Composable ColumnScope.() -> Unit) {
    GBottomSheet(onDismiss) {
        Column(Modifier.semantics { paneTitle = title }) {
            GSheetTitle(title, summary, closeTitle, dismiss = onDismiss)
            content()
        }
    }
}

// MARK: Side drawer

/**
 * A drawer sliding in from the leading edge over a dimmed page: a swipe from the edge opens it, a swipe back, a tap on
 * the page or the system's back closes it. Out of screen readers' reach while closed.
 */
@Composable
fun GSideDrawer(open: Boolean, onOpenChange: (Boolean) -> Unit, modifier: Modifier = Modifier, closeTitle: String = "Close",
                drawer: @Composable ColumnScope.() -> Unit, content: @Composable () -> Unit) {
    val still = gReduceMotion()
    var dragged by remember { mutableStateOf<Float?>(null) }
    BoxWithConstraints(modifier.fillMaxSize()) {
        val width = minOf(maxWidth * 0.85f, 340.dp)
        val widthPx = with(LocalDensity.current) { width.toPx() }
        val target = if (open) 0f else -widthPx
        val animated by animateFloatAsState(target, if (still) snap() else GMotion.pane(), label = "drawer")
        val offset = dragged ?: animated
        val progress = ((offset + widthPx) / widthPx).coerceIn(0f, 1f)
        content()
        if (open) BackHandler { onOpenChange(false) }
        if (progress > 0f) {
            Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f * progress))
                .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { onOpenChange(false) }
                .clearAndSetSemantics {})
            Column(Modifier.width(width).fillMaxHeight().offset { IntOffset(offset.roundToInt(), 0) }
                .gGlass(GGlassDensity.Thick, RoundedCornerShape(topEnd = GRadius.glass, bottomEnd = GRadius.glass))
                .pointerInput(widthPx) {
                    detectHorizontalDragGestures(
                        onDragEnd = {
                            val end = dragged ?: 0f
                            dragged = null
                            if (end < -widthPx * 0.3f) onOpenChange(false)
                        },
                        onDragCancel = { dragged = null },
                    ) { _, amount -> dragged = ((dragged ?: 0f) + amount).coerceIn(-widthPx, 0f) }
                }
                .semantics { paneTitle = closeTitle; dismiss { onOpenChange(false); true } },
                content = drawer)
        }
        if (!open) {
            // A swipe from the edge opens it.
            Box(Modifier.width(18.dp).fillMaxHeight().pointerInput(widthPx) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        val end = dragged ?: -widthPx
                        dragged = null
                        if (end > -widthPx * 0.7f) onOpenChange(true)
                    },
                    onDragCancel = { dragged = null },
                ) { _, amount -> dragged = ((dragged ?: -widthPx) + amount).coerceIn(-widthPx, 0f) }
            })
        }
    }
}

// MARK: Quick search

/** An entry of the quick search: a page, an action, a conversation… `icon`: the Mac's name. */
data class GCommandItem(val id: String, val label: String, val icon: String, val detail: String? = null,
                        val keywords: List<String> = emptyList(), val shortcut: String? = null, val perform: () -> Unit)

data class GCommandGroup(val title: String, val items: List<GCommandItem>)

/**
 * The quick search: a field, then the entries that match, by group (accents and case ignored); a hardware keyboard's
 * arrows choose, Return opens, Escape closes; a tap beside it closes it too.
 */
@Composable
fun GCommandPalette(groups: List<GCommandGroup>, onDismiss: () -> Unit, prompt: String = "Search", nothing: String = "Nothing matches.",
                    name: String = "Quick search") {
    val colors = G.colors
    var query by remember { mutableStateOf("") }
    var active by remember { mutableStateOf(0) }
    val shown = remember(query, groups) {
        groups.mapNotNull { group ->
            val kept = GCommandSearch.filter(group.items, query, if (query.isBlank()) 6 else 8)
            if (kept.isEmpty()) null else group.copy(items = kept)
        }
    }
    val ordered = shown.flatMap { it.items }
    LaunchedEffect(query) { active = 0 }
    fun run(index: Int) {
        val item = ordered.getOrNull(index) ?: return
        onDismiss()
        item.perform()
    }
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }
    val list = rememberLazyListState()
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxSize().clickable(remember { MutableInteractionSource() }, indication = null, onClick = onDismiss),
            contentAlignment = Alignment.TopCenter) {
            Column(Modifier.padding(start = 16.dp, end = 16.dp, top = 72.dp).widthIn(max = 620.dp).fillMaxWidth()
                .shadow(24.dp, RoundedCornerShape(GRadius.glass)).background(G.surfaceOpaque, RoundedCornerShape(GRadius.glass))
                .border(gLiquidBorder(), RoundedCornerShape(GRadius.glass)).clip(RoundedCornerShape(GRadius.glass))
                .clickable(remember { MutableInteractionSource() }, indication = null) {}
                .semantics { paneTitle = name }
                .onPreviewKeyEvent { event ->
                    if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                    when (event.key) {
                        Key.DirectionDown -> { active = (active + 1).coerceAtMost(ordered.size - 1).coerceAtLeast(0); true }
                        Key.DirectionUp -> { active = (active - 1).coerceAtLeast(0); true }
                        Key.Escape -> { onDismiss(); true }
                        else -> false
                    }
                }) {
                Row(Modifier.fillMaxWidth().height(52.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GIcon("magnifyingglass", size = 15f, color = colors.textSecondary)
                    BasicTextField(query, { query = it }, Modifier.weight(1f).focusRequester(focus).semantics { contentDescription = name },
                        singleLine = true, textStyle = G.type.body.copy(color = colors.textPrimary), cursorBrush = SolidColor(colors.accent),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Go), keyboardActions = KeyboardActions(onGo = { run(active) }),
                        decorationBox = { field ->
                            Box(contentAlignment = Alignment.CenterStart) {
                                if (query.isEmpty()) Text(prompt, style = G.type.body, color = colors.textDiscret)
                                field()
                            }
                        })
                }
                if (ordered.isEmpty()) {
                    Text(nothing, style = G.type.subheadline, color = colors.textSecondary, modifier = Modifier.fillMaxWidth().padding(24.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                } else {
                    LaunchedEffect(active) { if (ordered.isNotEmpty()) list.animateScrollToItem(indexOfRow(shown, active)) }
                    LazyColumn(Modifier.heightIn(max = 420.dp).padding(6.dp), state = list) {
                        var index = 0
                        shown.forEach { group ->
                            item(key = "group-${group.title}") {
                                Text(group.title.uppercase(), style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold, letterSpacing = G.type.caption2.fontSize * 0.07f),
                                    color = colors.textSecondary, modifier = Modifier.padding(start = 10.dp, end = 10.dp, top = 10.dp, bottom = 2.dp)
                                        .semantics { heading() })
                            }
                            val start = index
                            items(group.items, key = { "${group.title}/${it.id}" }) { item ->
                                val position = start + group.items.indexOf(item)
                                CommandRow(item, position == active) { run(position) }
                            }
                            index += group.items.size
                        }
                    }
                }
            }
        }
    }
}

/** The list's row (group titles included) of the `active`-th entry. */
private fun indexOfRow(groups: List<GCommandGroup>, active: Int): Int {
    var rows = 0
    var entries = 0
    for (group in groups) {
        rows += 1
        if (active < entries + group.items.size) return rows + (active - entries)
        rows += group.items.size
        entries += group.items.size
    }
    return 0
}

@Composable
private fun CommandRow(item: GCommandItem, active: Boolean, onClick: () -> Unit) {
    val colors = G.colors
    Row(Modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget).clip(RoundedCornerShape(GRadius.row))
        .background(if (active) colors.hover else Color.Transparent)
        .drawBehind { if (active) drawRect(colors.accent, Offset(0f, 8.dp.toPx()), Size(2.dp.toPx(), size.height - 16.dp.toPx())) }
        .clickable(role = Role.Button, onClick = onClick)
        .semantics(mergeDescendants = true) { selected = active }
        .padding(horizontal = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.width(20.dp), contentAlignment = Alignment.Center) {
            GIcon(item.icon, size = 15f, color = if (active) colors.accent else colors.textSecondary)
        }
        Text(item.label, style = G.type.subheadline.copy(fontWeight = FontWeight.Medium), color = colors.textPrimary, maxLines = 1,
            overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false))
        if (item.detail != null) Text(item.detail, style = G.type.footnote, color = colors.textSecondary, maxLines = 1)
        Box(Modifier.weight(1f, fill = true))
        if (item.shortcut != null) Text(item.shortcut, style = G.type.mono, color = colors.textDiscret)
    }
}

/** The quick search's filter, as GabaritCommon's: accents and case ignored, labels starting with the query first. */
object GCommandSearch {
    private fun fold(text: String): String =
        java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD).replace(Regex("\\p{M}+"), "").lowercase()

    fun filter(items: List<GCommandItem>, query: String, limit: Int): List<GCommandItem> {
        val folded = fold(query.trim())
        if (folded.isEmpty()) return items.take(limit)
        val matches = items.filter { item ->
            (listOf(item.label) + listOfNotNull(item.detail) + item.keywords).any { fold(it).contains(folded) }
        }
        return matches.sortedBy { if (fold(it.label).startsWith(folded)) 0 else 1 }.take(limit)
    }
}

// MARK: On the ground (4.0)

/** The selection's lighter pill on liquid glass (the current tab, the current page of the rail). */
@Composable
private fun gLiquidSelection(): Color = if (G.ground.mode == GGroundMode.LIGHT) Color.White.copy(alpha = 0.62f) else Color.White.copy(alpha = 0.14f)

/** A count's mark on the ground: rust, its number in white. */
@Composable
private fun GroundBadge(count: Int, modifier: Modifier) {
    Text(gBadgeText(count), style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold, fontFeatureSettings = "tnum"),
        color = Color.White, modifier = modifier.background(G.colors.accent, RoundedCornerShape(GRadius.pill)).padding(horizontal = 5.dp, vertical = 1.dp))
}

@Composable
private fun GroundTabBar(tabs: List<GTab>, selection: String, onSelect: (String) -> Unit, modifier: Modifier, backdrop: GBackdrop?) {
    val colors = G.colors
    val selected = gLiquidSelection()
    Box(modifier.fillMaxWidth().zIndex(1f).windowInsetsPadding(WindowInsets.navigationBars)
        .padding(horizontal = GSpacing.page, vertical = 8.dp)) {
        GLiquidGlass(Modifier.fillMaxWidth(), backdrop = backdrop) {
            Row(Modifier.fillMaxWidth().padding(5.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                tabs.forEach { tab ->
                    val current = tab.id == selection
                    val tint = if (current) colors.accentText else colors.ink2
                    Column(
                        Modifier.weight(1f).heightIn(min = 52.dp).clip(RoundedCornerShape(GRadius.pill))
                            .background(if (current) selected else Color.Transparent)
                            .clickable(role = Role.Tab) { onSelect(tab.id) }
                            .clearAndSetSemantics {
                                contentDescription = tab.title
                                this.selected = current
                                if (tab.badge > 0) stateDescription = gBadgeText(tab.badge)
                            },
                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
                    ) {
                        Box {
                            if (tab.image != null) Image(painterResource(tab.image), null, Modifier.size(22.dp), colorFilter = ColorFilter.tint(tint))
                            else GIcon(tab.icon, size = 19f, weight = if (current) FontWeight.SemiBold else FontWeight.Normal, color = tint)
                            if (tab.badge > 0) GroundBadge(tab.badge, Modifier.align(Alignment.TopEnd).offset(14.dp, (-5).dp))
                        }
                        Text(tab.title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium),
                            color = if (current) colors.ink else colors.ink2, maxLines = 1)
                    }
                }
            }
        }
    }
}

@Composable
private fun GroundTopBar(
    title: String?, modifier: Modifier, subtitle: String?, back: (() -> Unit)?, backTitle: String, statusBar: Boolean,
    leading: @Composable RowScope.() -> Unit, center: (@Composable () -> Unit)?, trailing: @Composable RowScope.() -> Unit, floating: Boolean,
) {
    val colors = G.colors
    val row = @Composable {
        Box(Modifier.fillMaxWidth().heightIn(min = if (floating) 52.dp else 56.dp).padding(horizontal = 4.dp), contentAlignment = Alignment.CenterStart) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                if (back != null) GFrameButton("chevron.left", backTitle, onClick = back) else Spacer(Modifier.width(8.dp))
                leading()
                if (title != null && center == null) {
                    Column(Modifier.weight(1f).padding(horizontal = 8.dp).semantics(mergeDescendants = true) { heading() }) {
                        Text(title, style = G.type.headline, color = colors.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (!subtitle.isNullOrEmpty()) Text(subtitle, style = G.type.caption, color = colors.ink2, maxLines = 1)
                    }
                } else Spacer(Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(if (floating) 0.dp else 6.dp)) { trailing() }
            }
            if (center != null) Box(Modifier.align(Alignment.Center)) { center() }
        }
    }
    CompositionLocalProvider(LocalContentColor provides colors.ink, LocalGFrameStyle provides GFrameStyle.Ground) {
        Box(modifier.fillMaxWidth().zIndex(1f).then(if (statusBar) Modifier.windowInsetsPadding(WindowInsets.statusBars) else Modifier)
            .then(if (floating) Modifier.padding(horizontal = GSpacing.page, vertical = 6.dp) else Modifier.padding(end = 8.dp))) {
            if (floating) GLiquidGlass(Modifier.fillMaxWidth()) { row() } else row()
        }
    }
}

@Composable
private fun GroundFrameButton(icon: String, title: String, isOn: Boolean, onClick: () -> Unit) {
    val colors = G.colors
    val onLiquid = LocalGOnLiquid.current
    val tint = if (isOn) colors.accentText else if (onLiquid) colors.ink2 else colors.ink
    Box(Modifier.size(GControlMetrics.touchTarget).clip(CircleShape).clickable(role = Role.Button, onClick = onClick)
        .semantics { contentDescription = title }, contentAlignment = Alignment.Center) {
        if (onLiquid) GIcon(icon, size = 17f, color = tint)
        else Box(Modifier.size(38.dp).gLiquidGlass(CircleShape), contentAlignment = Alignment.Center) {
            GIcon(icon, size = 16f, color = tint)
        }
    }
}

@Composable
private fun GroundRailItem(title: String, icon: String, current: Boolean, onClick: () -> Unit, badge: Int) {
    val colors = G.colors
    val shape = RoundedCornerShape(GRadius.row)
    Column(
        Modifier.fillMaxWidth().heightIn(min = 56.dp).then(if (current) Modifier.gLiquidGlass(shape) else Modifier).clip(shape)
            .clickable(role = Role.Tab, onClick = onClick)
            .clearAndSetSemantics {
                contentDescription = title
                selected = current
                if (badge > 0) stateDescription = gBadgeText(badge)
            },
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically),
    ) {
        Box {
            GIcon(icon, size = 18f, weight = if (current) FontWeight.SemiBold else FontWeight.Normal, color = if (current) colors.accent else colors.ink2)
            if (badge > 0) GroundBadge(badge, Modifier.align(Alignment.TopEnd).offset(14.dp, (-6).dp))
        }
        Text(title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium),
            color = if (current) colors.ink else colors.ink2, maxLines = 1)
    }
}
