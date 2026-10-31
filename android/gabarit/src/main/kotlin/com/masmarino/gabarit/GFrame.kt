package com.masmarino.gabarit

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
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

// Gabarit's frame for Compose, as on the iPhone and the iPad: the dark frame (a band, the rail), the bottom tab bar,
// sheets, bubble menus, the side drawer and the quick search.

/** A count on an icon (a tab, a rail item): "99+" beyond 99. */
fun gBadgeText(count: Int): String = if (count > 99) "99+" else count.toString()

// MARK: Bars

/** A tab of the bottom bar: its title, its icon (the Mac's name), a count. */
data class GTab(val id: String, val title: String, val icon: String, val badge: Int = 0)

/** Gabarit's bottom bar: flat on the surface, a fine line above, the current tab in rust and underlined from the top. */
@Composable
fun GTabBar(tabs: List<GTab>, selection: String, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    val colors = G.colors
    Row(modifier.fillMaxWidth().background(colors.surface).drawBehind {
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
                            drawRect(colors.accent, Offset(inset, 0f), Size(size.width - 2 * inset, 2.dp.toPx()))
                        }
                    },
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterVertically),
            ) {
                Box {
                    GIcon(tab.icon, size = 20f, weight = if (current) FontWeight.SemiBold else FontWeight.Normal, color = tint)
                    if (tab.badge > 0) {
                        Text(gBadgeText(tab.badge), style = G.type.caption2.copy(fontWeight = FontWeight.SemiBold, fontFeatureSettings = "tnum"),
                            color = colors.textPrimary, modifier = Modifier.align(Alignment.TopEnd).offset(16.dp, (-6).dp)
                                .background(colors.track, RoundedCornerShape(GRadius.xs)).padding(horizontal = 5.dp, vertical = 1.dp))
                    }
                }
                Text(tab.title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium), color = tint,
                    maxLines = 1)
            }
        }
    }
}

/**
 * The dark band on top of a screen (the frame): its title and what sits on each side, the same in both appearances.
 * `subtitle`: discreet under the title.
 */
@Composable
fun GTopBar(title: String, modifier: Modifier = Modifier, subtitle: String? = null, leading: @Composable RowScope.() -> Unit = {},
            trailing: @Composable RowScope.() -> Unit = {}) {
    GScheme(dark = true) {
        Row(modifier.fillMaxWidth().background(GFrameColor.ground).heightIn(min = 52.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            leading()
            Column(Modifier.weight(1f).padding(horizontal = 8.dp).semantics(mergeDescendants = true) { heading() }) {
                Text(title, style = G.type.headline, color = GFrameColor.text, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (subtitle != null) Text(subtitle, style = G.type.caption, color = GFrameColor.textDiscret, maxLines = 1)
            }
            trailing()
        }
    }
}

/** A round icon button on the dark frame (a band's action): `title` is what screen readers say. */
@Composable
fun GFrameButton(icon: String, title: String, isOn: Boolean = false, onClick: () -> Unit) {
    Box(Modifier.size(GControlMetrics.touchTarget).clip(CircleShape).background(if (isOn) GFrameColor.selected else Color.Transparent)
        .clickable(role = Role.Button, onClick = onClick).semantics { contentDescription = title }, contentAlignment = Alignment.Center) {
        GIcon(icon, size = 17f, color = if (isOn) GFrameColor.accent else GFrameColor.textSecondary)
    }
}

/**
 * A page of the dark rail (a large screen, a tablet): the icon and its name; the current page in rust, on a slight
 * ground, with a line on the left; `badge`: a count on the icon.
 */
@Composable
fun GRailItem(title: String, icon: String, current: Boolean, onClick: () -> Unit, badge: Int = 0) {
    val tint = if (current) GFrameColor.accent else GFrameColor.textDiscret
    Column(
        Modifier.fillMaxWidth().heightIn(min = 52.dp).clip(RoundedCornerShape(GRadius.sm))
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
                        .background(GFrameColor.rim, RoundedCornerShape(GRadius.xs)).padding(horizontal = 4.dp, vertical = 1.dp))
            }
        }
        Text(title, style = G.type.caption2.copy(fontWeight = if (current) FontWeight.SemiBold else FontWeight.Medium), color = tint, maxLines = 1)
    }
}

/** The dark rail on the leading side (a large screen): its pages, from the top. */
@Composable
fun GRail(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    GScheme(dark = true) {
        Column(modifier.width(92.dp).fillMaxHeight().background(GFrameColor.ground).padding(horizontal = 6.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp), content = content)
    }
}

/**
 * The dark band under a settings page's bar: the icon ringed by a fine line, the title and the sentence that says what
 * the page is for. `accessory`: on the right.
 */
@Composable
fun GPageBand(icon: String, title: String, summary: String, accessory: @Composable () -> Unit = {}) {
    Row(Modifier.fillMaxWidth().background(GFrameColor.ground).padding(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 18.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        Box(Modifier.size(48.dp).border(1.dp, GFrameColor.rim, RoundedCornerShape(GRadius.md)), contentAlignment = Alignment.Center) {
            GIcon(icon, size = 22f, color = GFrameColor.text)
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = G.type.title2, color = GFrameColor.text, modifier = Modifier.semantics { heading() })
            Text(summary, style = G.type.subheadline, color = GFrameColor.textSecondary)
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

/** A bubble menu's lines, split by a fine line, on the surface: put it in a `DropdownMenu`. */
@Composable
fun GMenu(items: List<@Composable () -> Unit>) {
    Column(Modifier.widthIn(min = 240.dp).background(G.surfaceOpaque)) {
        items.forEachIndexed { index, item ->
            if (index > 0) Box(Modifier.fillMaxWidth().height(1.dp).background(G.colors.hairline))
            item()
        }
    }
}

// MARK: Sheets

/** A sheet's title: large, its sentence below, the back arrow before it if `back`, the cross on the right. */
@Composable
fun GSheetTitle(title: String, summary: String? = null, closeTitle: String = "Close", backTitle: String = "Back", back: (() -> Unit)? = null,
                dismiss: () -> Unit) {
    val colors = G.colors
    Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        if (back != null) {
            Box(Modifier.size(GControlMetrics.touchTarget).clickable(role = Role.Button, onClick = back).semantics { contentDescription = backTitle },
                contentAlignment = Alignment.Center) {
                Box(Modifier.size(30.dp).background(colors.track, CircleShape), contentAlignment = Alignment.Center) {
                    GIcon("chevron.left", size = 14f, weight = FontWeight.SemiBold, color = colors.textSecondary)
                }
            }
        }
        Column(Modifier.weight(1f).padding(top = 6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = G.type.title2, color = colors.textPrimary, maxLines = 2, modifier = Modifier.semantics { heading() })
            if (summary != null) Text(summary, style = G.type.callout, color = colors.textDiscret)
        }
        GCloseButton(closeTitle, onClick = dismiss)
    }
}

/**
 * A sheet from the bottom: Gabarit's title and cross on top, then the content on the page's ground. The system's back
 * gesture and a swipe down close it too.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GSheet(title: String, onDismiss: () -> Unit, summary: String? = null, closeTitle: String = "Close", content: @Composable ColumnScope.() -> Unit) {
    val state = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = state, containerColor = G.backgroundOpaque,
        shape = RoundedCornerShape(topStart = GRadius.xl, topEnd = GRadius.xl), dragHandle = null) {
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
    val colors = G.colors
    val still = gReduceMotion()
    var dragged by remember { mutableStateOf<Float?>(null) }
    BoxWithConstraints(modifier.fillMaxSize()) {
        val width = minOf(maxWidth * 0.85f, 340.dp)
        val widthPx = with(LocalDensity.current) { width.toPx() }
        val target = if (open) 0f else -widthPx
        val animated by animateFloatAsState(target, if (still) snap() else tween(260), label = "drawer")
        val offset = dragged ?: animated
        val progress = ((offset + widthPx) / widthPx).coerceIn(0f, 1f)
        content()
        if (open) BackHandler { onOpenChange(false) }
        if (progress > 0f) {
            Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.35f * progress))
                .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { onOpenChange(false) }
                .clearAndSetSemantics {})
            Column(Modifier.width(width).fillMaxHeight().offset { IntOffset(offset.roundToInt(), 0) }.background(colors.surface)
                .drawBehind { drawLine(colors.hairline, Offset(size.width - 0.5f, 0f), Offset(size.width - 0.5f, size.height), 1.dp.toPx()) }
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
                .shadow(24.dp, RoundedCornerShape(GRadius.lg)).background(colors.surface, RoundedCornerShape(GRadius.lg))
                .border(1.dp, colors.border.copy(alpha = 0.6f), RoundedCornerShape(GRadius.lg)).clip(RoundedCornerShape(GRadius.lg))
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
                Box(Modifier.fillMaxWidth().height(1.dp).background(colors.hairline))
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
    Row(Modifier.fillMaxWidth().heightIn(min = GControlMetrics.touchTarget).clip(RoundedCornerShape(GRadius.sm))
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
