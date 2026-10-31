package com.masmarino.gabarit

import androidx.compose.ui.graphics.Color

/**
 * The dark frame's colours (the rail, the bands, a window's header): the same in both appearances, as Apple's
 * (GFrameColor), GTK's and WinUI's. Its accent is the dark appearance's.
 */
object GFrameColor {
    val ground: Color get() = GPalette.graphite950
    val text: Color get() = GPalette.graphite100
    val textSecondary: Color get() = GPalette.graphite300
    val textDiscret: Color get() = GPalette.graphite400
    val accent: Color get() = GPalette.rust400
    /** A rim, a badge's ground. */
    val rim: Color get() = GPalette.graphite700
    /** The line under a header. */
    val line: Color get() = GPalette.graphite700.copy(alpha = 0.7f)
    val hover: Color get() = GPalette.graphite100.copy(alpha = 0.05f)
    val selected: Color get() = GPalette.graphite100.copy(alpha = 0.09f)
    /** The close cross's press: a little stronger, on a small circle. */
    val closeHover: Color get() = GPalette.graphite100.copy(alpha = 0.12f)
}
