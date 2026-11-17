package com.masmarino.gabarit

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** The content glass's precomputed blur: a small copy, its sharp edges softened; the photo's tone holds the ink. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], application = android.app.Application::class)
class GGroundBlurTest {
    private fun halves(): Bitmap {
        val bitmap = Bitmap.createBitmap(400, 400, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(0xFF000000.toInt())
        canvas.drawRect(0f, 0f, 200f, 400f, Paint().apply { color = 0xFFFFFFFF.toInt() })
        return bitmap
    }

    @Test
    fun theCopyIsSmallAndSoft() = runBlocking {
        val blurred = assertNotNull(GGroundBlur.compute(halves().asImageBitmap())).let { GGroundBlur.compute(halves().asImageBitmap())!! }
        assertEquals(GGroundBlur.width, blurred.width)
        val pixels = blurred.asAndroidBitmap()
        val middle = pixels.getPixel(blurred.width / 2, blurred.height / 2) and 0xFF
        // At the edge between white and black, a grey: the edge is soft.
        assertTrue("edge $middle", middle in 40..215)
    }

    @Test
    fun aPhotosToneHoldsTheInk() {
        val tone = gPhotoTone(GGrounds.dark, halves().asImageBitmap())
        // White ink on a white half: the veil must darken it a good deal.
        assertTrue("veil ${tone.veil}", tone.veil > 0.5f)
    }
}
