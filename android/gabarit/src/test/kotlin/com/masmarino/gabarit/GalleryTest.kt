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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Gabarit's gallery for Android: the Mac gallery's sections (galerie/apple), light and dark, drawn on the JVM by
 * Robolectric to build/galerie/<section>-<appearance>.png. Nothing is compared: the images are to be looked at.
 *
 *     ./gradlew :gabarit:testDebugUnitTest --tests com.masmarino.gabarit.GalleryTest
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], application = android.app.Application::class, qualifiers = "w420dp-h900dp-xhdpi")
class GalleryTest {
    private fun draw(name: String, content: @Composable () -> Unit) {
        for ((appearance, dark) in listOf("light" to false, "dark" to true)) {
            val activity = Robolectric.buildActivity(ComponentActivity::class.java).setup().get()
            activity.actionBar?.hide()
            activity.setContent { GTheme(dark = dark) { Box(Modifier.fillMaxSize().gPageGround().padding(16.dp)) { content() } } }
            repeat(40) { Thread.sleep(25); shadowOf(Looper.getMainLooper()).idle() }
            val view = activity.window.decorView
            val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.draw(Canvas(bitmap))
            val folder = File("build/galerie").apply { mkdirs() }
            File(folder, "$name-$appearance.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    @Test fun controls() = draw("controls") {
        var on by remember { mutableStateOf(true) }
        var off by remember { mutableStateOf(false) }
        var choice by remember { mutableStateOf(1) }
        var value by remember { mutableStateOf(0.6f) }
        var count by remember { mutableStateOf(3) }
        var name by remember { mutableStateOf("Florian") }
        Column(Modifier.fillMaxWidth().gSurface(RoundedCornerShape(GRadius.lg), G.colors.surface, G.colors.hairline).padding(20.dp),
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

    @Test fun rows() = draw("rows") {
        var on by remember { mutableStateOf(true) }
        var choice by remember { mutableStateOf(0) }
        var query by remember { mutableStateOf("") }
        Column(verticalArrangement = Arrangement.spacedBy(GFormMetrics.sectionSpacing)) {
            GSearchField(query, { query = it }, prompt = "Search")
            GFormSection("Account", "Rows laid as they come, each with its line.") {
                GFormRow("Profile", detail = "Name, photo, pronouns", icon = "person.crop.circle", divider = true, onClick = {}) {
                    GIcon("chevron.right", size = 13f)
                }
                GToggleRow("Read receipts", on, { on = it }, Modifier.gRowDivider(), "Others see when you read.", contentPadding = GFormMetrics.rowPadding)
                GFormRow("Devices", icon = "macbook.and.iphone", divider = true) { Text("3") }
                GFormRow("Sign out", icon = "rectangle.portrait.and.arrow.right", destructive = true, onClick = {})
            }
            GFormSection("Profile card", "Fields in a card: the ground marks them, the card is their frame.") {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    GTextField("Display name", "Florian", {})
                    GTextField("Pronouns", "", {}, prompt = "they/them")
                }
            }
            GFormSection("Theme") {
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
            GTopBar("Léa", subtitle = "online", back = {}, statusBar = false, trailing = { GFrameButton("phone", "Call") {} })
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
            Column(Modifier.background(G.backgroundOpaque, RoundedCornerShape(GRadius.xl))) {
                GSheetTitle("New space", "A place to share with a few people.", back = {}) {}
                Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                    GFormSection("Members", "They can leave at any time.", rows = listOf(
                        { GRowButton("Invite people", {}) }, { GRowButton("Leave the space", {}, destructive = true) }))
                }
            }
            Box(Modifier.width(260.dp).gSurface(RoundedCornerShape(GRadius.md), G.surfaceOpaque, G.colors.hairline)) {
                GMenu(listOf(
                    { GMenuItem("Reply", "arrowshape.turn.up.left", {}) },
                    { GMenuItem("Pinned", "pin", {}, checked = true) },
                    { GMenuItem("Delete", "trash", {}, destructive = true) },
                ))
            }
        }
    }
}
