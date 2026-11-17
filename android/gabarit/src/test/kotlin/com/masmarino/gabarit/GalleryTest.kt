package com.masmarino.gabarit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.border
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Gabarit's gallery for Android: the Mac gallery's sections (galerie/apple), on the light and dark grounds and on the
 * `aurore` ambiance, drawn on the JVM by Robolectric to build/galerie/<section>-<appearance>.png. Nothing is compared:
 * the images are to be looked at. Robolectric draws in software: the liquid glass's live blur (RenderEffect) is not
 * there, the ground's blurred copy stands for it; the content glass's precomputed blur is (see `ground-photo`).
 *
 *     ./gradlew :gabarit:testDebugUnitTest --tests com.masmarino.gabarit.GalleryTest
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], application = android.app.Application::class, qualifiers = "w420dp-h900dp-xhdpi")
class GalleryTest {
    private val appearances = listOf<Triple<String, Boolean, GGroundSpec?>>(
        Triple("light", false, null), Triple("dark", true, null), Triple("aurore", true, GGrounds.aurore))

    private fun draw(name: String, only: List<Triple<String, Boolean, GGroundSpec?>> = appearances, padding: Boolean = true,
                     content: @Composable () -> Unit) {
        for ((appearance, dark, ground) in only) {
            val activity = Robolectric.buildActivity(ComponentActivity::class.java).setup().get()
            activity.actionBar?.hide()
            activity.setContent {
                GTheme(dark = dark, ground = ground, reduceTransparency = false, highContrast = false) {
                    Box(Modifier.fillMaxSize().gPageGround().padding(if (padding) 16.dp else 0.dp)) { content() }
                }
            }
            repeat(40) { Thread.sleep(25); shadowOf(Looper.getMainLooper()).idle() }
            val view = activity.window.decorView
            val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.draw(Canvas(bitmap))
            val folder = File("build/galerie").apply { mkdirs() }
            File(folder, "$name-$appearance.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            System.getenv("GABARIT_GALLERY_COPY")?.let { copy ->
                File(copy).mkdirs()
                File(folder, "$name-$appearance.png").copyTo(File(copy, "android-$name-$appearance.png"), overwrite = true)
            }
        }
    }

    @Test fun controls() = draw("controls") {
        var on by remember { mutableStateOf(true) }
        var off by remember { mutableStateOf(false) }
        var choice by remember { mutableStateOf(1) }
        var value by remember { mutableStateOf(0.6f) }
        var count by remember { mutableStateOf(3) }
        var name by remember { mutableStateOf("Florian") }
        GGlass(Modifier.fillMaxWidth()) { Column(Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Controls", style = G.type.title2, color = G.colors.textPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GButton("Primary", {}, variant = GButtonVariant.Primary)
                GButton("Secondary", {})
                GButton("Ghost", {}, variant = GButtonVariant.Ghost)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GButton("Danger", {}, variant = GButtonVariant.Danger)
                GButton("Delete", {}, destructive = true)
                GButton("New", {}, icon = "plus")
                GCloseButton("Close") {}
            }
            GToggleRow("Notifications", on, { on = it }, detail = "A sentence that explains the setting.")
            GToggleRow("Off", off, { off = it })
            GTextField("Name", name, { name = it })
            GPicker("Appearance", listOf("System", "Light", "Dark"), listOf("System", "Light", "Dark")[choice], { it }, { })
            GPicker("Size", listOf(0, 1, 2), choice, { listOf("Small", "Medium", "Large")[it] }, { choice = it }, style = GPickerStyle.Chips)
            GPicker("Who sees when I am online, and when I was", listOf(0, 1), choice % 2, { listOf("My contacts", "Nobody")[it] }, { choice = it },
                style = GPickerStyle.Chips)
            GSlider(value, { value = it }, label = "Volume")
            GStepper("Reminders", count, { count = it }, 0..10)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { GTone.entries.forEach { GBadge("state", tone = it) } }
        } }
    }

    /** Each control at rest, held down and disabled, as the Mac's and Linux's galleries show them. */
    @Test fun states() = draw("states") {
        val controls: List<Pair<String, @Composable () -> Unit>> = listOf(
            "Primary" to { GButton("Save", {}, variant = GButtonVariant.Primary) },
            "Secondary" to { GButton("Reset", {}) },
            "Ghost" to { GButton("Later", {}, variant = GButtonVariant.Ghost) },
            "Danger" to { GButton("Delete", {}, variant = GButtonVariant.Danger) },
            "Destructive" to { GButton("Leave", {}, destructive = true) },
            "Close" to { GCloseButton("Close") {} },
            "Chips" to { Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) { GChip("On", true) {}; GChip("Off", false) {} } },
            "Menu" to { GMenuFace("Light") },
            "Switch" to { GSwitch(true) },
            "Icon" to { GIconButton("trash", "Delete", {}) },
            "Prominent" to { GButton("Send", {}, variant = GButtonVariant.GlassProminent) },
            "Segments" to { GSegmentedControl(listOf("Day", "Week"), "Day", { it }, {}, Modifier.width(150.dp)) },
            "Slider" to { GSlider(0.5f, {}, Modifier.width(120.dp)) },
        )
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row { Spacer(Modifier.width(90.dp)); listOf("Rest", "Pressed").forEach { Text(it, style = G.type.headline, color = G.colors.textPrimary, modifier = Modifier.width(160.dp)) } }
            controls.forEach { (name, control) ->
                Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text(name, style = G.type.caption, color = G.colors.textDiscret, modifier = Modifier.width(90.dp))
                    Box(Modifier.width(160.dp)) { control() }
                    Box(Modifier.width(160.dp)) {
                        androidx.compose.runtime.CompositionLocalProvider(LocalGPressedPreview provides true) {
                            if (name == "Menu") GMenuFace("Light", pressed = true)
                            else if (name == "Switch") GSwitch(true, pressed = true)
                            else if (name == "Slider") GSlider(0.5f, {}, Modifier.width(120.dp))
                            else control()
                        }
                    }
                }
            }
        }
    }

    @Test fun forms() = draw("forms") {
        var on by remember { mutableStateOf(true) }
        Column(verticalArrangement = Arrangement.spacedBy(GFormMetrics.sectionSpacing)) {
            GPageTitle("Notifications", "What reaches you, and when.")
            GFormSection("Messages", "Muted conversations never ring.", rows = listOf(
                { GRow { GToggleRow("Show previews", on, { on = it }, detail = "The first words of a message.") } },
                { GValueRow("Devices", "3") },
                { GRow { GFormButtons { GButton("Reset", {}); GButton("Save", {}, variant = GButtonVariant.Primary) } } },
            ))
            GFormSection("Members", rows = listOf({ GRowButton("Invite people", {}) }, { GRowButton("Leave the space", {}, destructive = true) }))
        }
    }

    /**
     * 4.1.1: a sheet (thick content glass, as `GBottomSheet` draws it, on the ground) holding fields, chips, switches and
     * two form sections: what lies in a light surface takes the ink's light tint, not white on white.
     */
    @Test fun sheet() = draw("sheet") {
        var title by remember { mutableStateOf("Buy a present for Léa") }
        var note by remember { mutableStateOf("") }
        var date by remember { mutableStateOf(false) }
        var important by remember { mutableStateOf(true) }
        var repeat by remember { mutableStateOf(0) }
        val shape = RoundedCornerShape(topStart = GRadius.glass, topEnd = GRadius.glass)
        Column(Modifier.fillMaxSize().padding(top = 40.dp)) {
            Column(Modifier.fillMaxSize().gGlass(GGlassDensity.Thick, shape, GGlassShadow.None).clip(shape)) {
                CompositionLocalProvider(LocalGInSheet provides true) {
                    GSheetTitle("Reminder", "On all your devices", dismiss = {})
                    Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                        GTextField("Title", title, { title = it })
                        GTextField("Note", note, { note = it }, prompt = "A word for later")
                        GChips(listOf(0, 1, 2), repeat, { listOf("Once", "Every day", "Every week")[it] }, { repeat = it })
                        GFormSection("Due") {
                            GToggleRow("Date", date, { date = it }, contentPadding = GFormMetrics.rowPadding)
                            GToggleRow("Important", important, { important = it }, contentPadding = GFormMetrics.rowPadding)
                        }
                        GFormSection("Remind me", rows = listOf(
                            { GFormRow("Before", trailing = { Text("15 min") }) },
                            { GFormRow("Sound", trailing = { Text("Chime") }) },
                            { GRow { GTextField("", "", {}, prompt = "A field in the section") } },
                        ))
                        GFormButtons { GButton("Delete", {}, destructive = true); GButton("Save", {}, variant = GButtonVariant.Primary) }
                    }
                }
            }
        }
    }

    @Test fun rows() = draw("rows") {
        var on by remember { mutableStateOf(true) }
        var choice by remember { mutableStateOf(0) }
        var query by remember { mutableStateOf("") }
        Column(verticalArrangement = Arrangement.spacedBy(GFormMetrics.sectionSpacing)) {
            GSearchField(query, { query = it }, prompt = "Search")
            GFormSection("Account", "Rows laid as they come: no line between them (4.0).") {
                GFormRow("Profile", detail = "Name, photo, pronouns", icon = "person.crop.circle", divider = true, onClick = {}) {
                    GIcon("chevron.right", size = 13f)
                }
                GToggleRow("Read receipts", on, { on = it }, Modifier.gRowDivider(), "Others see when you read.", contentPadding = GFormMetrics.rowPadding)
                GFormRow("Devices", icon = "macbook.and.iphone", divider = true) { Text("3") }
                GFormRow("Sign out", icon = "rectangle.portrait.and.arrow.right", destructive = true, onClick = {})
            }
            GFormSection("Profile card", "Fields in a card: a hollow of thin glass (4.1).") {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    GTextField("Display name", "Florian", {})
                    GTextField("Pronouns", "", {}, prompt = "they/them")
                }
            }
            GFormSection("Theme", "separated = true: 3.x's lines.", separated = true) {
                listOf("System", "Light", "Dark").forEachIndexed { i, t -> GChoiceRow(t, choice == i, { choice = i }, divider = i < 2) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                GIconTile("bell", G.colors.accent)
                GIconTile("lock", GTone.Info.base)
                GSpinner()
                GSpinner(progress = 0.6f)
                GIconButton("trash", "Delete", {})
                GIcon("star.fill", "Favourite", tint = G.colors.warning)
            }
            GProgressBar(0.4f)
        }
    }

    @Test fun frame() = draw("frame") {
        var tab by remember { mutableStateOf("messages") }
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            GTopBar("Messages", subtitle = "2 unread", statusBar = false, trailing = { GFrameButton("magnifyingglass", "Search") {} })
            GTopBar("Léa", subtitle = "online", back = {}, statusBar = false, floating = true, trailing = { GFrameButton("phone", "Call") {} })
            GTopBar("Graphite", subtitle = "GFrameStyle.Graphite (3.x)", statusBar = false, style = GFrameStyle.Graphite)
            GPageBand("bell", "Notifications", "What reaches you, and when.")
            Row {
                GRail(Modifier.height(260.dp)) {
                    GRailItem("Today", "sun.max", false, {})
                    GRailItem("Messages", "bubble.left.and.bubble.right", true, {}, badge = 2)
                    GRailItem("Spaces", "square.grid.2x2", false, {})
                }
                Column(Modifier.padding(start = 12.dp).width(260.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    GSidebarRow("Profile", "person.crop.circle", true, {})
                    GSidebarRow("Notifications", "bell", false, {}, detail = "12")
                    GSidebarRow("Privacy", "lock", false, {}, warns = true)
                    GNavTabs(listOf("Chats", "Calls", "Files"), "Chats", { it }, {})
                }
            }
            GTabBar(listOf(GTab("today", "Today", "sun.max"), GTab("messages", "Messages", "bubble.left.and.bubble.right", 2),
                GTab("spaces", "Spaces", "square.grid.2x2")), tab, { tab = it })
        }
    }

    @Test fun feedback() = draw("feedback") {
        val toasts = rememberGToastState()
        remember { toasts.show("Link copied", "link"); 0 }
        GToastHost(toasts, Modifier.fillMaxSize()) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    GBadge("Article", icon = "doc.text")
                    GBadge("Synced", tone = GTone.Success)
                    GBadge("Offline", tone = GTone.Warning)
                    GBadge("Error", tone = GTone.Error)
                    GBadge("New", icon = "sparkles", tone = GTone.Info)
                }
                GSkeleton(Modifier.width(260.dp))
                GSkeleton(Modifier.width(200.dp))
                GSkeleton(height = 60.dp, cornerRadius = GRadius.md)
                GTypingDots("Writing")
                Box(Modifier.height(380.dp)) {
                    GEmptyState("tray", "No messages yet", "Start a conversation with a contact.", actionTitle = "New conversation",
                        actionIcon = "square.and.pencil", action = {})
                }
            }
        }
    }

    @Test fun overlays() = draw("overlays") {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(Modifier.gGlass(GGlassDensity.Thick)) {
                GSheetTitle("New space", "A place to share with a few people.", back = {}) {}
                Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                    GFormSection("Members", "They can leave at any time.", rows = listOf(
                        { GRowButton("Invite people", {}) }, { GRowButton("Leave the space", {}, destructive = true) }))
                }
            }
            Box(Modifier.width(260.dp).shadow(8.dp, RoundedCornerShape(GRadius.glass)).border(gLiquidBorder(), RoundedCornerShape(GRadius.glass))
                .clip(RoundedCornerShape(GRadius.glass))) {
                GMenu(listOf(
                    { GMenuItem("Reply", "arrowshape.turn.up.left", {}) },
                    { GMenuItem("Pinned", "pin", {}, checked = true) },
                    { GMenuItem("Delete", "trash", {}, destructive = true) },
                ))
            }
        }
    }

    /**
     * 4.1: the controls on liquid glass, on the ground and in a card (a lens there): buttons (glass, prominent, 4.0's
     * solid look kept by `LocalGButtonLook`), round icon buttons, chips and labels, the segmented control and a page's
     * tabs, the switch and the slider held down, fields (a hollow of thin glass; an error's rim).
     */
    @Test fun liquid() = draw("liquid") {
        var segment by remember { mutableStateOf("Week") }
        var tab by remember { mutableStateOf("Chats") }
        var chip by remember { mutableStateOf(1) }
        var name by remember { mutableStateOf("Florian") }
        val label = @Composable { t: String -> Text(t, style = G.type.caption, color = G.colors.ink2) }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            label("On the ground")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                GButton("Save", {}, variant = GButtonVariant.Primary)
                GButton("Cancel", {})
                GButton("Later", {}, variant = GButtonVariant.Ghost)
                GIconButton("square.and.pencil", "New", {}, tint = G.colors.ink)
                GCloseButton("Close") {}
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.runtime.CompositionLocalProvider(LocalGPressedPreview provides true) {
                    GButton("Held", {}, variant = GButtonVariant.Primary)
                    GButton("Held", {})
                }
                GButton("Delete", {}, destructive = true)
                androidx.compose.runtime.CompositionLocalProvider(LocalGButtonLook provides GButtonLook.Solid) {
                    GButton("Solid", {}, variant = GButtonVariant.Primary)
                    GButton("Solid", {})
                }
            }
            GChips(listOf(0, 1, 2), chip, { listOf("All", "Unread", "Mentions")[it] }, { chip = it })
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                GBadge("Article", icon = "doc.text"); GTone.entries.forEach { GBadge(it.name, tone = it) }
            }
            GSegmentedControl(listOf("Day", "Week", "Month"), segment, { it }, { segment = it })
            GNavTabs(listOf("Chats", "Calls", "Files"), tab, { it }, { tab = it })
            GSearchField("", {}, prompt = "Search")
            GGlass(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    label("In a card (lenses)")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        GButton("Save", {}, variant = GButtonVariant.Primary)
                        GButton("Cancel", {})
                        GChip("Unread", true) {}
                        GChip("All", false) {}
                        GIconButton("trash", "Delete", {})
                    }
                    GSegmentedControl(listOf("Day", "Week", "Month"), segment, { it }, { segment = it })
                    GTextField("Name", name, { name = it })
                    GTextField("Email", "florian@", {}, isError = true, footer = "Not an address.")
                    GSearchField("", {}, prompt = "Search", glass = false)
                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
                        GSwitch(true); GSwitch(true, pressed = true); GSwitch(false, pressed = true)
                        androidx.compose.runtime.CompositionLocalProvider(LocalGPressedPreview provides true) {
                            GSlider(0.4f, {}, Modifier.weight(1f))
                        }
                    }
                    GStepper("Reminders", 3, {}, 0..10)
                }
            }
        }
    }

    /** 4.0: the ground, the content glass in three densities, the liquid glass, an inset list without lines. */
    @Test fun glass() = draw("glass", padding = false) {
        var tab by remember { mutableStateOf("messages") }
        var query by remember { mutableStateOf("") }
        var chosen by remember { mutableStateOf(1) }
        Box(Modifier.fillMaxSize()) {
            Column(Modifier.fillMaxSize().padding(horizontal = GSpacing.page), verticalArrangement = Arrangement.spacedBy(GSpacing.gap)) {
                GTopBar("Marie Dupont", subtitle = "online", back = {}, statusBar = false, floating = true, modifier = Modifier.padding(top = 8.dp),
                    trailing = { GFrameButton("phone", "Call") {}; GFrameButton("video", "Video") {} })
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Messages", style = G.type.display, color = G.colors.ink, modifier = Modifier.weight(1f).padding(start = 4.dp))
                    GFrameButton("person", "Profile") {}
                    GFrameButton("square.and.pencil", "New") {}
                }
                GSearchField(query, { query = it }, prompt = "Search")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(GGlassDensity.Thin to "Thin", GGlassDensity.Regular to "Regular", GGlassDensity.Thick to "Thick").forEach { (density, label) ->
                        GGlass(Modifier.weight(1f).height(96.dp), density) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(label, style = G.type.headline, color = G.colors.ink)
                                Text("A long text reads on it.", style = G.type.footnote, color = G.colors.ink2)
                            }
                        }
                    }
                }
                GInsetList {
                    listOf("Camille Roux" to "Ephemeral message", "Resto du vendredi" to "Hugo is writing…",
                        "Marie Dupont" to "You: With pleasure", "Hugo Petit" to "You: I'm looking at it").forEachIndexed { i, (name, line) ->
                        GInsetRow(selected = i == chosen, onClick = { chosen = i }) {
                            Box(Modifier.size(40.dp).background(listOf(GTone.Warning, GTone.Success, GTone.Error, GTone.Info)[i].base, CircleShape),
                                contentAlignment = Alignment.Center) { Text(name.take(1), style = G.type.headline, color = Color.White) }
                            Column(Modifier.weight(1f)) {
                                Text(name, style = G.type.headline, color = G.colors.ink)
                                Text(line, style = G.type.subheadline, color = G.colors.ink2, maxLines = 1)
                            }
                            Text("08:2$i", style = G.type.caption, color = G.colors.ink3)
                        }
                    }
                }
                GFormSection("Reminders") {
                    GFormRow("Call the plumber", icon = "circle") { Text("10:00") }
                    GFormRow("Return the books", icon = "circle") { Text("yesterday") }
                }
            }
            GTabBar(listOf(GTab("today", "For you", "sun.max"), GTab("messages", "Messages", "bubble.left.and.bubble.right", 9),
                GTab("spaces", "Spaces", "square.grid.2x2"), GTab("music", "Music", "music.note")), tab, { tab = it },
                Modifier.align(Alignment.BottomCenter))
        }
    }

    /** A photo as the ground: the content glass draws its blurred copy (computed once), the liquid glass too here. */
    @Test fun groundPhoto() = draw("ground-photo", only = listOf(Triple("dark", true, GGroundSpec.plain(Color(0xFF2B3A55),
        GGroundMode.DARK, GGlassKind.TINTED, Color(0xFF101828))), Triple("light", false, null)), padding = false) {
        val photo = remember { samplePhoto() }
        GGround(Modifier.fillMaxSize(), image = photo) {
            Column(Modifier.fillMaxSize().padding(GSpacing.page), verticalArrangement = Arrangement.spacedBy(GSpacing.gap)) {
                GTopBar("Club alpin", subtitle = "#announcements", back = {}, statusBar = false, floating = true)
                Spacer(Modifier.height(120.dp))
                GGlass(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Snowshoes in the Vercors", style = G.type.headline, color = G.colors.ink)
                        Text("From the 12th to the 14th of December: sign up until Friday. The glass draws the photo's blurred copy.",
                            style = G.type.body, color = G.colors.ink2)
                    }
                }
                GInsetList(glass = GGlassDensity.Thin) {
                    GInsetRow(selected = true) { Text("# general", style = G.type.body, color = G.colors.ink) }
                    GInsetRow { Text("# hikes", style = G.type.body, color = G.colors.ink2) }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    GFrameButton("plus", "Add") {}
                    GLiquidGlass(Modifier.weight(1f).height(44.dp)) {
                        Text("Write in #general", style = G.type.body, color = G.colors.ink2, modifier = Modifier.padding(horizontal = 16.dp))
                    }
                    GFrameButton("mic", "Speak") {}
                }
            }
        }
    }

    /** A photo-like ground: bands and discs of colour with sharp edges, so that a blur shows. */
    private fun samplePhoto(): androidx.compose.ui.graphics.ImageBitmap {
        val bitmap = Bitmap.createBitmap(420, 900, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)
        val colors = intArrayOf(0xFF2E5E8C.toInt(), 0xFF7FB3D5.toInt(), 0xFFE9D8A6.toInt(), 0xFF5E8C4A.toInt(), 0xFF2F4F2F.toInt())
        colors.forEachIndexed { i, c -> paint.color = c; canvas.drawRect(0f, i * 180f, 420f, (i + 1) * 180f, paint) }
        paint.color = 0xFFFF8A3D.toInt(); canvas.drawCircle(320f, 140f, 70f, paint)
        paint.color = 0xFFFFFFFF.toInt(); canvas.drawCircle(90f, 520f, 50f, paint)
        paint.color = 0xFFB0303A.toInt(); canvas.drawRect(40f, 620f, 380f, 660f, paint)
        return bitmap.asImageBitmap()
    }
}
