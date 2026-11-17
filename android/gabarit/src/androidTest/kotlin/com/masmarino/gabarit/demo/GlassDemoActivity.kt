package com.masmarino.gabarit.demo

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.masmarino.gabarit.G
import com.masmarino.gabarit.GFrameButton
import com.masmarino.gabarit.GGlass
import com.masmarino.gabarit.GGlassDensity
import com.masmarino.gabarit.GGround
import com.masmarino.gabarit.GGrounds
import com.masmarino.gabarit.GInsetRow
import com.masmarino.gabarit.GSearchField
import com.masmarino.gabarit.GSpacing
import com.masmarino.gabarit.GTab
import com.masmarino.gabarit.GTabBar
import com.masmarino.gabarit.GTheme
import com.masmarino.gabarit.GTone
import com.masmarino.gabarit.GTopBar
import com.masmarino.gabarit.gBackdropSource
import com.masmarino.gabarit.rememberGBackdrop

/**
 * The glass on a device: the ground (`-e ground light|dark|aurore|photo`), a list scrolling under a floating tab bar
 * of liquid glass (its backdrop), a floating header, content glass. Not part of the library.
 */
class GlassDemoActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val which = intent.getStringExtra("ground") ?: "aurore"
        val photo = if (which == "photo") samplePhoto() else null
        setContent {
            val ground = when (which) { "light" -> GGrounds.light; "dark" -> GGrounds.dark; "photo" -> GGrounds.dark; else -> GGrounds.aurore }
            GTheme(dark = which != "light", ground = ground) {
                var tab by remember { mutableStateOf("messages") }
                var query by remember { mutableStateOf("") }
                val backdrop = rememberGBackdrop()
                GGround(Modifier.fillMaxSize(), image = photo) {
                    LazyColumn(Modifier.fillMaxSize().gBackdropSource(backdrop), contentPadding = PaddingValues(GSpacing.page, 110.dp, GSpacing.page, 120.dp),
                        verticalArrangement = Arrangement.spacedBy(GSpacing.gap)) {
                        item { GSearchField(query, { query = it }, prompt = "Search") }
                        item {
                            GGlass(Modifier.fillMaxWidth(), GGlassDensity.Regular) {
                                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Agenda", style = G.type.headline, color = G.colors.ink)
                                    Text("10:30 Dentist · 13:00 Call with the team", style = G.type.body, color = G.colors.ink2)
                                }
                            }
                        }
                        items(24) { i ->
                            GInsetRow(selected = i == 2, onClick = {}) {
                                Box(Modifier.size(40.dp).background(GTone.entries[i % 4].base, CircleShape), contentAlignment = Alignment.Center) {
                                    Text("${'A' + i}", style = G.type.headline, color = Color.White)
                                }
                                Column(Modifier.weight(1f)) {
                                    Text("Conversation ${i + 1}", style = G.type.headline, color = G.colors.ink)
                                    Text("The last words of it", style = G.type.subheadline, color = G.colors.ink2)
                                }
                            }
                        }
                    }
                    GTopBar("Marie Dupont", subtitle = "online", back = {}, floating = true,
                        trailing = { GFrameButton("phone", "Call") {}; GFrameButton("video", "Video") {} })
                    GTabBar(listOf(GTab("today", "For you", "sun.max"), GTab("messages", "Messages", "bubble.left.and.bubble.right", 9),
                        GTab("spaces", "Spaces", "square.grid.2x2"), GTab("music", "Music", "music.note")), tab, { tab = it },
                        Modifier.align(Alignment.BottomCenter), backdrop = backdrop)
                    Row(Modifier.align(Alignment.CenterEnd).padding(end = 4.dp).height(1.dp)) {}
                }
            }
        }
    }

    private fun samplePhoto() = Bitmap.createBitmap(540, 1200, Bitmap.Config.ARGB_8888).also { bitmap ->
        val canvas = Canvas(bitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        intArrayOf(0xFF2E5E8C.toInt(), 0xFF7FB3D5.toInt(), 0xFFE9D8A6.toInt(), 0xFF5E8C4A.toInt(), 0xFF2F4F2F.toInt()).forEachIndexed { i, c ->
            paint.color = c; canvas.drawRect(0f, i * 240f, 540f, (i + 1) * 240f, paint)
        }
        paint.color = 0xFFFF8A3D.toInt(); canvas.drawCircle(420f, 160f, 90f, paint)
        paint.color = 0xFFFFFFFF.toInt(); canvas.drawCircle(110f, 700f, 70f, paint)
    }.asImageBitmap()
}
