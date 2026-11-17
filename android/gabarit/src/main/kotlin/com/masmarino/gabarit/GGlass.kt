package com.masmarino.gabarit

import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.RenderEffect as AndroidRenderEffect
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.util.LruCache
import androidx.annotation.RequiresApi
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.CacheDrawScope
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.asComposeRenderEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.layer.GraphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin

// The ground and the two glasses (4.0). One ground runs under the whole window, bars included; on it lie the content
// glass (panels, cards: dense enough for a long text, its light on the top edge, a half-point rim, a wide soft shadow)
// and the liquid glass (what commands and floats: the tab bar, floating headers, a field to write in, menus; never
// content): more transparent, a short live blur that saturates what is under it, a brighter edge of light at the top
// left, a hollow of light at the bottom, a short shadow, and from Android 13 an edge that refracts.
//
// The glass never reads the screen: it draws the ground again under itself, at its exact place in the window. The
// content glass draws a small blurred copy of a photo ground, computed once off the UI thread (a gradient blurred is
// itself: it is drawn as it is); the liquid glass blurs the ground live (RenderEffect), and what an app marks as its
// backdrop (`gBackdropSource`). Light is the edge of things: nothing here is a line, but for high contrast.

/** The content glass's densities: thin (a large panel on a quiet ground), regular (a card), thick (a sheet, a chosen row). */
enum class GGlassDensity { Thin, Regular, Thick }

/** A content glass's shadow: a panel's (wide and soft, with a near one), the near one only (a row), none. */
enum class GGlassShadow { Panel, Near, None }

// MARK: The ground

/**
 * A ground of the app's own, with its geometry: a photo (`image`, filling it, its blurred copy for the glass) under the
 * theme's ground's veil. Set by `GGround`; without it the ground is the theme's, as it lies under the whole window.
 */
@Stable
class GGroundScene internal constructor() {
    internal var image by mutableStateOf<ImageBitmap?>(null)
    internal var blurred by mutableStateOf<ImageBitmap?>(null)
    /** The photo's own tone (its veil, its liquid glass's white), from its blurred copy. */
    internal var tone by mutableStateOf<GGroundTone?>(null)
    internal var origin by mutableStateOf(Offset.Zero)
    internal var size by mutableStateOf(Size.Zero)
}

private val LocalGGroundScene = staticCompositionLocalOf<GGroundScene?> { null }

/** Something lies on liquid glass: what floats inside it stays plain (no glass on glass). */
val LocalGOnLiquid = staticCompositionLocalOf { false }

/**
 * The ground under a screen: the theme's ground (`G.ground`), or a photo (`image`) under its veil, filling this box;
 * the glass inside it draws it again, at its place. It changes with a crossfade (`GMotion.ground()`). The ground runs
 * under the whole screen: put it at the root, bars included.
 */
@Composable
fun GGround(modifier: Modifier = Modifier, image: ImageBitmap? = null, content: @Composable BoxScope.() -> Unit) {
    val scene = remember { GGroundScene() }
    val blurred = rememberGGroundBlur(image)
    val spec = G.ground
    val tone = remember(blurred, spec) { blurred?.let { gPhotoTone(spec, it) } }
    scene.image = image
    scene.blurred = blurred
    scene.tone = tone
    val veil = tone?.let { spec.glass.copy(alpha = it.veil) } ?: G.colors.groundVeil
    Box(modifier.onGloballyPositioned { scene.origin = it.positionInWindow(); scene.size = it.size.toSize() }) {
        Crossfade(spec to image, Modifier.matchParentSize(), animationSpec = GMotion.ground<Float>(), label = "ground") { (s, i) ->
            Box(Modifier.fillMaxSize().drawBehind { drawGroundOf(s, i, null, if (i == image) veil else Color.Transparent, size, Offset.Zero, null) })
        }
        CompositionLocalProvider(LocalGGroundScene provides scene) { content() }
    }
}

/**
 * This view's ground: the theme's ground (or the `GGround` around it), placed as it lies under the whole window, so
 * that a bar, a column and the page beside it are one ground.
 */
fun Modifier.gGround(): Modifier = composed {
    val painter = rememberGGroundPainter()
    val position = remember { GPosition() }
    onGloballyPositioned { position.value = it.positionInWindow() }.drawBehind { painter.paint(this, position.value, blurred = false) }
}

/** Where a view lies in the window: read while drawing, it redraws, never recomposes. */
@Stable
private class GPosition {
    var value by mutableStateOf(Offset.Zero)
}

/** Paints the current ground at a place in the window: the scene's (a `GGround`) or the theme's across the window. */
@Stable
internal class GGroundPainter(
    private val spec: GGroundSpec,
    private val veil: Color,
    private val scene: GGroundScene?,
    private val window: Size,
) {
    /** The ground under a view at `position` (in the window), drawn in its own space; `blurred`: the photo's copy. */
    fun paint(scope: DrawScope, position: Offset, blurred: Boolean, filter: ColorFilter? = null) {
        val origin = scene?.origin ?: Offset.Zero
        val page = scene?.size?.takeIf { it.width > 0f } ?: window
        val image = scene?.image
        val shown = if (image != null && blurred) scene.blurred ?: image else image
        val photoVeil = scene?.tone?.let { spec.glass.copy(alpha = it.veil) } ?: veil
        scope.drawGroundOf(spec, shown, image?.takeIf { blurred && scene.blurred != null }, photoVeil, page, position - origin, filter)
    }
}

@Composable
internal fun rememberGGroundPainter(): GGroundPainter {
    val spec = G.ground
    val veil = G.colors.groundVeil
    val scene = LocalGGroundScene.current
    val container = LocalWindowInfo.current.containerSize
    val view = LocalView.current.rootView
    val window = if (container.width > 0) container.toSize() else Size(view.width.toFloat(), view.height.toFloat())
    return remember(spec, veil, scene, window) { GGroundPainter(spec, veil, scene, window) }
}

/**
 * A ground of size `page` drawn in a view lying at `offset` in it: the photo (`image`, filling the page, centred) or the
 * gradient and its light; then the veil. `source`: the photo the blurred `image` was made from (its proportions).
 */
private fun DrawScope.drawGroundOf(spec: GGroundSpec, image: ImageBitmap?, source: ImageBitmap?, veil: Color, page: Size, offset: Offset,
                                   filter: ColorFilter?) {
    if (page.width <= 0f || page.height <= 0f) return
    translate(-offset.x, -offset.y) {
        if (image != null) {
            // As `scaledToFill`: the photo covers the page, centred, its edges cut (its proportions are the source's).
            val w = (source ?: image).width.toFloat()
            val h = (source ?: image).height.toFloat()
            val scale = max(page.width / w, page.height / h)
            val fx = image.width / w
            val fy = image.height / h
            val l = (page.width / scale).coerceIn(1f, w)
            val t = (page.height / scale).coerceIn(1f, h)
            drawImage(image, srcOffset = IntOffset(((w - l) / 2 * fx).roundToInt(), ((h - t) / 2 * fy).roundToInt()),
                srcSize = IntSize((l * fx).roundToInt().coerceIn(1, image.width), (t * fy).roundToInt().coerceIn(1, image.height)),
                dstSize = IntSize(page.width.roundToInt(), page.height.roundToInt()), filterQuality = FilterQuality.Low, colorFilter = filter)
        } else {
            drawRect(gGroundGradient(spec, page), size = page, colorFilter = filter)
            val light = spec.light
            if (light.strength > 0f) {
                val radius = light.radius * max(page.width, page.height)
                drawRect(Brush.radialGradient(listOf(light.color.copy(alpha = light.strength), light.color.copy(alpha = 0f)),
                    Offset(light.x * page.width, light.y * page.height), radius.coerceAtLeast(1f)), size = page, colorFilter = filter)
            }
        }
        if (veil.alpha > 0f) drawRect(veil, size = page)
    }
}

/** The ground's gradient over `page`, as CSS's `linear-gradient(<angle>deg, …)`: its line through the centre, its stops even. */
internal fun gGroundGradient(spec: GGroundSpec, page: Size): Brush {
    val stops = if (spec.stops.size == 1) spec.stops + spec.stops else spec.stops
    return gCssLinear(spec.angle, page, stops.mapIndexed { i, c -> i.toFloat() / (stops.size - 1) to c })
}

/** CSS's linear gradient at `angle` (0: upwards, 90: rightwards, 180: downwards) over a box of `size`. */
internal fun gCssLinear(angle: Float, size: Size, stops: List<Pair<Float, Color>>): Brush {
    val radians = Math.toRadians(angle.toDouble())
    val dx = sin(radians).toFloat()
    val dy = -cos(radians).toFloat()
    val half = (abs(size.width * dx) + abs(size.height * dy)) / 2
    val centre = Offset(size.width / 2, size.height / 2)
    return Brush.linearGradient(*stops.toTypedArray(), start = centre - Offset(dx, dy) * half, end = centre + Offset(dx, dy) * half)
}

/**
 * Gabarit's motion as a finite spec (Crossfade, AnimatedVisibility want one): all of `GMotion`'s are (tweens, springs).
 */
@Suppress("UNCHECKED_CAST")

// MARK: The blurred copy

/**
 * The blurred copy of a photo ground, computed once (null the time of it): right away for a small photo (a reduced
 * background, up to a million points: a few milliseconds), off the UI thread for a larger one; kept by image, so a
 * screen and the next share it.
 */
@Composable
internal fun rememberGGroundBlur(image: ImageBitmap?): ImageBitmap? {
    var blurred by remember(image) {
        mutableStateOf(image?.let { GGroundBlur.cached(it) ?: if (it.width.toLong() * it.height <= 1_000_000L) GGroundBlur.computeNow(it) else null })
    }
    LaunchedEffect(image) {
        if (image == null || blurred != null) return@LaunchedEffect
        blurred = withContext(Dispatchers.Default) {
            try { GGroundBlur.compute(image) }
            catch (e: CancellationException) { throw e }
            catch (e: Throwable) { android.util.Log.w("Gabarit", "The ground's blur: $e"); null }
        }
    }
    return blurred
}

/**
 * The content glass's blur, as SkollN's Immersion: a small copy of the photo (72 points wide, the display enlarges it
 * smoothly), three passes of a box blur (nearly a Gaussian blur), its colours a little more saturated
 * (`GGlassValues.saturationContent`). Nothing is computed again while scrolling: a glass only draws an image.
 */
object GGroundBlur {
    /** The small copy's width, and the blur's radius in its points. */
    const val width = 72
    const val radius = 4

    private class Entry(val source: WeakReference<ImageBitmap>, val blurred: ImageBitmap)
    private val cache = LruCache<String, Entry>(16)

    private fun key(source: ImageBitmap) = "${System.identityHashCode(source)}:${source.width}x${source.height}"

    fun cached(source: ImageBitmap): ImageBitmap? = cache.get(key(source))?.takeIf { it.source.get() === source }?.blurred

    /** The small blurred copy; stops between two steps if the screen no longer wants it. */
    suspend fun compute(source: ImageBitmap): ImageBitmap? {
        val active = currentCoroutineContext()
        return blur(source) { active.ensureActive() }
    }

    /** The small blurred copy, now (a small photo). */
    fun computeNow(source: ImageBitmap): ImageBitmap? = try { blur(source) {} }
    catch (e: Throwable) { android.util.Log.w("Gabarit", "The ground's blur: $e"); null }

    private fun blur(source: ImageBitmap, check: () -> Unit): ImageBitmap? {
        cached(source)?.let { return it }
        val raw = source.asAndroidBitmap()
        // A GPU image cannot be read point by point: a copy, given back as soon as it has served.
        val origin = if (raw.config == Bitmap.Config.HARDWARE) raw.copy(Bitmap.Config.ARGB_8888, false) ?: return null else raw
        val w = width.coerceAtMost(origin.width).coerceAtLeast(1)
        val h = (origin.height.toFloat() * w / origin.width).roundToInt().coerceAtLeast(1)
        // Halved step by step (a single step from 1,600 to 72 points would skip pixels), then to the size wanted.
        var b = origin
        try {
            while (b.width / 2 >= w * 2) {
                check()
                val half = Bitmap.createScaledBitmap(b, b.width / 2, (b.height / 2).coerceAtLeast(1), true)
                if (b !== raw) b.recycle()
                b = half
            }
            val small = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            Canvas(small).drawBitmap(b, android.graphics.Rect(0, 0, b.width, b.height), android.graphics.Rect(0, 0, w, h),
                Paint(Paint.FILTER_BITMAP_FLAG).apply {
                    colorFilter = ColorMatrixColorFilter(android.graphics.ColorMatrix().apply { setSaturation(GGlassValues.saturationContent) })
                })
            val pixels = IntArray(w * h)
            small.getPixels(pixels, 0, w, 0, 0, w, h)
            repeat(3) { check(); boxBlur(pixels, w, h, radius) }
            small.setPixels(pixels, 0, w, 0, 0, w, h)
            val image = small.asImageBitmap()
            cache.put(key(source), Entry(WeakReference(source), image))
            return image
        } finally {
            // The intermediate copies (never the screen's image): given back now rather than at collection.
            if (b !== raw) b.recycle()
            if (origin !== raw && origin !== b) origin.recycle()
        }
    }

    /** A box blur of radius `r`: a pass row by row, then column by column. */
    fun boxBlur(pixels: IntArray, w: Int, h: Int, r: Int) {
        val between = IntArray(pixels.size)
        pass(pixels, between, w, h, r, horizontal = true)
        pass(between, pixels, w, h, r, horizontal = false)
    }

    /** One pass, row by row (or column by column): the sliding mean of 2r + 1 points, the edges extended. */
    private fun pass(source: IntArray, out: IntArray, w: Int, h: Int, r: Int, horizontal: Boolean) {
        val lines = if (horizontal) h else w
        val length = if (horizontal) w else h
        val divisor = 2 * r + 1
        for (line in 0 until lines) {
            fun index(i: Int): Int {
                val j = i.coerceIn(0, length - 1)
                return if (horizontal) line * w + j else j * w + line
            }
            var a = 0; var red = 0; var green = 0; var blue = 0
            for (i in -r..r) {
                val p = source[index(i)]
                a += p ushr 24; red += (p shr 16) and 0xFF; green += (p shr 8) and 0xFF; blue += p and 0xFF
            }
            for (i in 0 until length) {
                out[index(i)] = ((a / divisor) shl 24) or ((red / divisor) shl 16) or ((green / divisor) shl 8) or (blue / divisor)
                val leaving = source[index(i - r)]
                val entering = source[index(i + r + 1)]
                a += (entering ushr 24) - (leaving ushr 24)
                red += ((entering shr 16) and 0xFF) - ((leaving shr 16) and 0xFF)
                green += ((entering shr 8) and 0xFF) - ((leaving shr 8) and 0xFF)
                blue += (entering and 0xFF) - (leaving and 0xFF)
            }
        }
    }
}

/**
 * A photo's tone: the theme's ground's, computed on the photo's darkest and brightest points (from its small copy)
 * rather than on the ground's stops, so that the ink holds on it too.
 */
internal fun gPhotoTone(spec: GGroundSpec, small: ImageBitmap): GGroundTone {
    val bitmap = small.asAndroidBitmap().let { if (it.config == Bitmap.Config.HARDWARE) it.copy(Bitmap.Config.ARGB_8888, false) else it }
    val w = bitmap.width
    val h = bitmap.height
    val pixels = IntArray(w * h)
    bitmap.getPixels(pixels, 0, w, 0, 0, w, h)
    val colors = pixels.map { Color(it).copy(alpha = 1f) }
    val darkest = colors.minBy { GLuminance.of(it) }
    val brightest = colors.maxBy { GLuminance.of(it) }
    val photo = spec.copy(name = "photo", angle = 180f, stops = listOf(darkest, brightest),
        light = GGroundLight(darkest, 0.5f, 0.5f, 1f, 0f), ink = spec.resolvedInk, shade = spec.resolvedShade)
    return gToneOf(photo)
}

// MARK: Shadows and light

/**
 * A CSS box shadow (offset `y`, `blur`, `spread`, in dp) of `color` around `shape`, outside it only (the glass is
 * translucent: a shadow under it would show through as a grey frame).
 */
private class GShadow(val y: Float, val blur: Float, val spread: Float, val color: Color)

private fun CacheDrawScope.shadowPainter(shape: Shape, path: Path, shadows: List<GShadow>): DrawScope.() -> Unit {
    if (shadows.isEmpty() || shadows.all { it.color.alpha == 0f }) return {}
    val prepared = shadows.map { s ->
        val spread = s.spread.dp.toPx()
        val grown = Size((size.width + 2 * spread).coerceAtLeast(1f), (size.height + 2 * spread).coerceAtLeast(1f))
        val outline = Path().apply { addOutline(shape.createOutline(grown, layoutDirection, this@shadowPainter)) }
        outline.translate(Offset(-spread, -spread + s.y.dp.toPx()))
        // CSS's blur is twice the Gaussian's sigma; Skia's radius is about sigma / 0.57735.
        val radius = (s.blur.dp.toPx() / 2 / 0.57735f).coerceAtLeast(0.5f)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = s.color.toArgb()
            maskFilter = BlurMaskFilter(radius, BlurMaskFilter.Blur.NORMAL)
        }
        outline.asAndroidPath() to paint
    }
    return {
        clipPath(path, ClipOp.Difference) {
            drawIntoCanvas { canvas -> prepared.forEach { (p, paint) -> canvas.nativeCanvas.drawPath(p, paint) } }
        }
    }
}

/** The band of the shape not covered by the shape moved down by `by` px: its top edge, following its corners. */
// Light is the edge of things, and it runs up and down, never across (iOS 27's liquid glass, not iOS 26's slanted
// gleam): a point of light along the edge, `top` at the top, out by the middle, `bottom` at the bottom, the sides only
// the passage between the two; inside, two soft lights (`sheen`), about 8 points under the top and 6 over the bottom.
// `from` and `to`: where the whole glass's top and bottom lie, for a slice of it (a row of a list).

/** The edge's point of light along `edge` (the glass's outline, or the whole card's for a slice), cut to `path`. */
private fun DrawScope.gEdgeLight(path: Path, edge: Path, top: Color, bottom: Color, from: Float = 0f, to: Float = size.height) {
    val rim = Brush.verticalGradient(0f to top, 0.5f to Color.Transparent, 1f to bottom, startY = from, endY = to)
    clipPath(path) { drawPath(edge, rim, style = Stroke(2.dp.toPx())) }
}

/** The two soft lights inside, under the top and over the bottom (clamped: nothing past them). */
private fun DrawScope.gSheen(path: Path, sheen: Color, from: Float = 0f, to: Float = size.height) {
    clipPath(path) {
        drawRect(Brush.verticalGradient(listOf(sheen, Color.Transparent), startY = from, endY = from + 8.dp.toPx()))
        drawRect(Brush.verticalGradient(listOf(Color.Transparent, sheen), startY = to - 6.dp.toPx(), endY = to))
    }
}

private fun Outline.path(): Path = Path().apply { addOutline(this@path) }

// MARK: The content glass

/**
 * The content glass, behind this view: the ground's blurred copy at its place, the glass's colour at `density`, the
 * edge's light drawn up and down (`glassRimTop` → nothing → `glassRimBottom`) and its two soft lights inside
 * (`glassSheen`), a wide soft shadow. The glass is dense with
 * `G.reduceTransparency` (`GGlassValues.reduced`); with `G.highContrast` its light becomes a true rim (`border`). Cut
 * what it holds to its corners yourself (`.clip(shape)`) if it may overflow.
 */
@Composable
fun Modifier.gGlass(
    density: GGlassDensity = GGlassDensity.Regular,
    shape: Shape = RoundedCornerShape(GRadius.glass),
    shadow: GGlassShadow = GGlassShadow.Panel,
): Modifier {
    val colors = G.colors
    val reduced = G.reduceTransparency
    val contrast = G.highContrast
    val painter = rememberGGroundPainter()
    val position = remember { GPosition() }
    val tint = when {
        reduced -> G.ground.glass.copy(alpha = GGlassValues.reduced)
        density == GGlassDensity.Thin -> colors.glassThin
        density == GGlassDensity.Regular -> colors.glassRegular
        else -> colors.glassThick
    }
    val shadows = when (shadow) {
        GGlassShadow.Panel -> listOf(
            GShadow(GGlassValues.shadowY, GGlassValues.shadowBlur, GGlassValues.shadowSpread, colors.glassShadow),
            GShadow(GGlassValues.shadowNearY, GGlassValues.shadowNearBlur, GGlassValues.shadowNearSpread, colors.glassShadowNear))
        GGlassShadow.Near -> listOf(GShadow(GGlassValues.shadowNearY, GGlassValues.shadowNearBlur, GGlassValues.shadowNearSpread, colors.glassShadowNear))
        GGlassShadow.None -> emptyList()
    }
    val saturate = remember { ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(GGlassValues.saturationContent) }) }
    return this.onGloballyPositioned { position.value = it.positionInWindow() }.drawWithCache {
        val path = shape.createOutline(size, layoutDirection, this).path()
        val shade = shadowPainter(shape, path, shadows)
        val line = 1.dp.toPx()
        onDrawBehind {
            shade()
            clipPath(path) {
                if (!reduced) painter.paint(this, position.value, blurred = true, filter = saturate)
                drawRect(tint)
            }
            if (contrast) drawPath(path, colors.border, style = Stroke(line))
            else {
                gSheen(path, colors.glassSheen)
                gEdgeLight(path, path, colors.glassRimTop, colors.glassRimBottom)
            }
        }
    }
}

/** A content glass holding a column: `gGlass` at `density`, what it holds cut to its corners. */
@Composable
fun GGlass(
    modifier: Modifier = Modifier,
    density: GGlassDensity = GGlassDensity.Regular,
    shape: Shape = RoundedCornerShape(GRadius.glass),
    shadow: GGlassShadow = GGlassShadow.Panel,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(modifier.gGlass(density, shape, shadow).clip(shape)) {
        CompositionLocalProvider(LocalContentColor provides G.colors.ink, LocalGOnGlass provides true, content = { content() })
    }
}

// MARK: The liquid glass

/**
 * What lies under the liquid glass besides the ground (a list scrolling under a floating tab bar): mark it with
 * `gBackdropSource`, give it to `gLiquidGlass`. The glass must not lie inside it (it would draw itself).
 */
@Stable
class GBackdrop internal constructor(internal val layer: GraphicsLayer) {
    internal var position by mutableStateOf(Offset.Zero)
    internal var recorded by mutableStateOf(false)
}

@Composable
fun rememberGBackdrop(): GBackdrop {
    val layer = rememberGraphicsLayer()
    return remember(layer) { GBackdrop(layer) }
}

/** What this view draws is also the backdrop of the liquid glass given `backdrop` (on a GPU canvas). */
fun Modifier.gBackdropSource(backdrop: GBackdrop): Modifier =
    this.onGloballyPositioned { backdrop.position = it.positionInWindow() }.drawWithContent {
        if (!drawContext.canvas.nativeCanvas.isHardwareAccelerated) {
            drawContent()
            return@drawWithContent
        }
        backdrop.layer.record { this@drawWithContent.drawContent() }
        backdrop.recorded = true
        drawLayer(backdrop.layer)
    }

/**
 * The liquid glass, behind this view: the ground (and `backdrop`) under it blurred live (`GGlassValues.blurLiquid`),
 * saturated (1.9) and brightened (1.06); the white of `glassLiquid`; its edge's light, up and down, never across
 * (`liquidRimTop` at the top, out by the middle, `liquidRimBottom` at the bottom); two soft lights inside, under the
 * top and over the bottom (`liquidSheen`); a short shadow (`liquidShadow`). From Android 13 its edge refracts (an AGSL shader). On a
 * software canvas (a test's), the ground's blurred copy stands for the live blur. Dense with `G.reduceTransparency`;
 * a true rim with `G.highContrast`. For what commands and floats, never for content.
 */
@Composable
fun Modifier.gLiquidGlass(
    shape: Shape = RoundedCornerShape(GRadius.pill),
    backdrop: GBackdrop? = null,
    shadow: Boolean = true,
): Modifier = gLiquidGlassOf(shape, backdrop, shadow)

/** `gLiquidGlass`, its white at `white` times the ground's (a thin glass: less); `tint`: the glass's own colour over it. */
@Composable
internal fun Modifier.gLiquidGlassOf(
    shape: Shape,
    backdrop: GBackdrop? = null,
    shadow: Boolean = true,
    white: Float = 1f,
    tint: Color = Color.Transparent,
    light: () -> Float = { 0f },
): Modifier {
    val colors = G.colors
    val reduced = G.reduceTransparency
    val contrast = G.highContrast
    val dense = G.ground.glass.copy(alpha = GGlassValues.reduced)
    val painter = rememberGGroundPainter()
    val position = remember { GPosition() }
    val layer = rememberGraphicsLayer()
    val scene = LocalGGroundScene.current
    val filter = remember { ColorFilter.colorMatrix(gLiquidMatrix()) }
    val shadows = if (shadow) listOf(GShadow(GGlassValues.shadowLiquidY, GGlassValues.shadowLiquidBlur, GGlassValues.shadowLiquidSpread,
        colors.liquidShadow)) else emptyList()
    return this.onGloballyPositioned { position.value = it.positionInWindow() }.drawWithCache {
        val outline = shape.createOutline(size, layoutDirection, this)
        val path = outline.path()
        val shade = shadowPainter(shape, path, shadows)
        val corner = when (outline) {
            is Outline.Rounded -> outline.roundRect.topLeftCornerRadius.x
            is Outline.Rectangle -> 0f
            else -> min(size.width, size.height) / 2
        }
        val effect = gLiquidEffect(GGlassValues.blurLiquid.dp.toPx(), size, corner, 1.dp.toPx())
        onDrawWithContent {
            shade()
            clipPath(path) {
                if (reduced) drawRect(dense)
                else {
                    val live = drawContext.canvas.nativeCanvas.isHardwareAccelerated
                    if (live) {
                        val at = position.value
                        layer.renderEffect = effect
                        layer.record {
                            painter.paint(this, at, blurred = false)
                            if (backdrop != null && backdrop.recorded) {
                                translate(backdrop.position.x - at.x, backdrop.position.y - at.y) { drawLayer(backdrop.layer) }
                            }
                        }
                        drawLayer(layer)
                    } else painter.paint(this, position.value, blurred = true, filter = filter)
                    val base = scene?.tone?.let { Color.White.copy(alpha = it.liquid) } ?: colors.glassLiquid
                    drawRect(base.copy(alpha = base.alpha * white))
                }
                // Pressed, the glass lights up (under its own colour: the text on a tinted glass keeps its contrast).
                val lit = light()
                if (lit > 0f) drawRect(Color.White.copy(alpha = lit))
                if (tint.alpha > 0f) drawRect(tint)
            }
            if (!contrast && tint.alpha < 0.5f) gSheen(path, colors.liquidSheen)
            drawContent()
            if (contrast) drawPath(path, colors.border, style = Stroke(1.dp.toPx()))
            else gEdgeLight(path, path, colors.liquidRimTop, colors.liquidRimBottom)
        }
    }
}

/**
 * A liquid glass holding a row or a box (a tab bar, a floating header, a search): `gLiquidGlass`, its content in the
 * ink; what floats inside it stays plain (`LocalGOnLiquid`).
 */
@Composable
fun GLiquidGlass(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(GRadius.pill),
    backdrop: GBackdrop? = null,
    contentAlignment: Alignment = Alignment.CenterStart,
    content: @Composable BoxScope.() -> Unit,
) {
    Box(modifier.gLiquidGlass(shape, backdrop), contentAlignment = contentAlignment) {
        CompositionLocalProvider(LocalContentColor provides G.colors.ink, LocalGOnLiquid provides true) { content() }
    }
}

// MARK: Controls on liquid glass (4.1)

/**
 * Inside a content glass (a card, a sheet, an inset list): a control's liquid glass lies on it as a lens, it does not
 * draw the ground again (it would show as a hole in the card). Set by `GGlass`, the forms' cards and `GBottomSheet`;
 * provide it around what a `Modifier.gGlass` holds.
 */
val LocalGOnGlass = staticCompositionLocalOf { false }

/**
 * A lens of liquid glass lying on something (a content glass, a track): its white (`white`), lit when held down
 * (`light`), its own colour (`tint`), its two soft lights and its edge's light up and down (a true rim with high
 * contrast), a short shadow; what is under it shows through, nothing is drawn again.
 */
@Composable
internal fun Modifier.gLiquidLens(
    shape: Shape,
    white: Color = G.colors.glassLiquid,
    shadow: Boolean = true,
    tint: Color = Color.Transparent,
    light: () -> Float = { 0f },
): Modifier {
    val colors = G.colors
    val contrast = G.highContrast
    val shadows = if (shadow) listOf(GShadow(GGlassValues.shadowLiquidY, GGlassValues.shadowLiquidBlur, GGlassValues.shadowLiquidSpread,
        colors.liquidShadow)) else emptyList()
    return this.drawWithCache {
        val path = shape.createOutline(size, layoutDirection, this).path()
        val shade = shadowPainter(shape, path, shadows)
        onDrawWithContent {
            shade()
            clipPath(path) {
                drawRect(white)
                val lit = light()
                if (lit > 0f) drawRect(Color.White.copy(alpha = lit))
                if (tint.alpha > 0f) drawRect(tint)
            }
            if (!contrast && tint.alpha < 0.5f) gSheen(path, colors.liquidSheen)
            drawContent()
            if (contrast) drawPath(path, colors.border, style = Stroke(1.dp.toPx()))
            else gEdgeLight(path, path, colors.liquidRimTop, colors.liquidRimBottom)
        }
    }
}

/** Where a control lies: on the ground, on a content glass (a lens), or on liquid glass (no glass on glass). */
internal enum class GControlPlace { Ground, Glass, Liquid }

@Composable
internal fun gControlPlace(): GControlPlace = when {
    LocalGOnLiquid.current -> GControlPlace.Liquid
    LocalGOnGlass.current || LocalGFormCard.current || LocalGInSheet.current -> GControlPlace.Glass
    else -> GControlPlace.Ground
}

/**
 * How a control's glass answers a finger: held down, it grows (`controlPressScale`, on the `bouncy` spring; not with
 * reduced motion) and lights up (white at `controlPressLight`). `scale` and `light` are read while drawing.
 */
@Stable
internal class GPressGlow(private val scaleState: State<Float>, private val lightState: State<Float>) {
    val scale: Float get() = scaleState.value
    val light: Float get() = lightState.value
}

@Composable
internal fun rememberGPressGlow(pressed: Boolean, grow: Boolean = true): GPressGlow {
    val still = gReduceMotion()
    val scale = animateFloatAsState(if (pressed && grow && !still) GGlassValues.controlPressScale else 1f,
        if (still) snap() else GMotion.bouncy(), label = "press")
    val light = animateFloatAsState(if (pressed) GGlassValues.controlPressLight else 0f,
        if (still) snap() else if (pressed) GMotion.linear() else GMotion.quick(), label = "light")
    return remember(scale, light) { GPressGlow(scale, light) }
}

/**
 * A control's liquid glass (4.1: a button, a chip, a round icon button): on the ground, `gLiquidGlass` (`thin`: less
 * white, no shadow); on a content glass, a lens of it; on liquid glass, only its colour and the light of the press (no
 * glass on glass). Held down (`pressed`), it grows a little and lights up. `tint`: a tinted glass's colour (the
 * prominent glass: the accent or the ink at `controlProminent`). Dense with `G.reduceTransparency`, a true rim with
 * `G.highContrast`.
 */
@Composable
internal fun Modifier.gControlGlass(shape: Shape, pressed: Boolean, tint: Color = Color.Transparent, thin: Boolean = false,
                                    grow: Boolean = true): Modifier {
    val glow = rememberGPressGlow(pressed, grow)
    val grown = this.graphicsLayer { scaleX = glow.scale; scaleY = glow.scale }
    val colors = G.colors
    return when (gControlPlace()) {
        GControlPlace.Liquid -> grown.drawWithCache {
            val path = shape.createOutline(size, layoutDirection, this).path()
            onDrawBehind {
                clipPath(path) {
                    if (tint.alpha > 0f) drawRect(tint)
                    if (glow.light > 0f) drawRect(colors.press.copy(alpha = colors.press.alpha * glow.light / GGlassValues.controlPressLight))
                }
            }
        }
        GControlPlace.Glass -> {
            val white = if (G.reduceTransparency) G.ground.glass.copy(alpha = GGlassValues.reduced) else colors.glassLiquid
            grown.gLiquidLens(shape, if (thin) white.copy(alpha = white.alpha * 0.6f) else white, shadow = !thin, tint = tint, light = { glow.light })
        }
        GControlPlace.Ground -> grown.gLiquidGlassOf(shape, shadow = !thin, white = if (thin) 0.6f else 1f, tint = tint, light = { glow.light })
    }
}

/**
 * A hollow of thin glass (4.1: a field): the thin glass's colour, the shade of the hollow (`glassHollow`) falling
 * inside from its top edge, the light caught by its bottom edge; no rim (with high contrast the field draws its own).
 * Dense with `G.reduceTransparency`.
 */
@Composable
fun Modifier.gGlassHollow(shape: Shape): Modifier {
    val colors = G.colors
    val fill = if (G.reduceTransparency) G.ground.glass.copy(alpha = GGlassValues.reduced) else colors.glassThin
    val hollow = colors.glassHollow
    val light = colors.liquidRimBottom
    val contrast = G.highContrast
    return this.drawWithCache {
        val edge = shape.createOutline(size, layoutDirection, this).path()
        // All but the shape, a hair lower: blurred and cut to the shape, only its shade on the inside remains.
        val outside = android.graphics.Path().apply {
            fillType = android.graphics.Path.FillType.EVEN_ODD
            val margin = 8.dp.toPx()
            addRect(-margin, -margin, size.width + margin, size.height + margin, android.graphics.Path.Direction.CW)
            addPath(edge.asAndroidPath(), 0f, 2.dp.toPx())
        }
        val shade = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = hollow.toArgb()
            maskFilter = BlurMaskFilter(2.5.dp.toPx(), BlurMaskFilter.Blur.NORMAL)
        }
        onDrawBehind {
            drawPath(edge, fill)
            // A hollow is a little darker than what is around it: a veil of its shade over the whole.
            drawPath(edge, hollow.copy(alpha = hollow.alpha * 0.4f))
            clipPath(edge) { drawIntoCanvas { it.nativeCanvas.drawPath(outside, shade) } }
            if (!contrast) gEdgeLight(edge, edge, Color.Transparent, light)
        }
    }
}

/** A prominent glass's colour: `color` at `controlProminent`. */
internal fun gProminent(color: Color): Color = color.copy(alpha = GGlassValues.controlProminent)

/**
 * The text on a glass tinted `tint` (its alpha the tint's) on this ground: white or the darkest ink, whichever holds
 * best at the glass's worst point (each stop of the ground, under its light or not, brightened as the liquid glass
 * does, its white `liquid` over it, lit by the press or not; dense with reduced transparency).
 */
internal fun GGroundSpec.inkOnTint(tint: Color, liquid: Float): Color {
    val candidates = listOf(Color.White, GPalette.graphite1000)
    return candidates.maxBy { text -> tintPoints(tint, liquid).minOf { GLuminance.contrast(GLuminance.rgb(it), GLuminance.rgb(text)) } }
}

/** The colours a glass tinted `tint` can show on this ground (see `inkOnTint`). */
internal fun GGroundSpec.tintPoints(tint: Color, liquid: Float): List<Color> {
    val b = GGlassValues.brightnessLiquid
    val grounds = stops.flatMap { stop ->
        val lit = light.color.copy(alpha = light.strength.coerceIn(0f, 1f)).compositeOver(stop)
        listOf(stop, lit)
    }.map { Color((it.red * b).coerceAtMost(1f), (it.green * b).coerceAtMost(1f), (it.blue * b).coerceAtMost(1f)) }
    val glasses = grounds.map { Color.White.copy(alpha = liquid).compositeOver(it) } + glass.copy(alpha = GGlassValues.reduced).compositeOver(middle)
    return glasses.flatMap { g -> listOf(g, Color.White.copy(alpha = GGlassValues.controlPressLight).compositeOver(g)) }
        .map { tint.compositeOver(it) }
}

/** Whether `text` holds 4.5:1 on a glass tinted `tint` on this ground, at its worst point. */
internal fun GGroundSpec.holds(text: Color, tint: Color, liquid: Float): Boolean =
    tintPoints(tint, liquid).minOf { GLuminance.contrast(GLuminance.rgb(it), GLuminance.rgb(text)) } >= GGlassValues.textMinimum

/** Whether `text` holds on the clear liquid glass of the current ground (a red text on a glass button). */
@Composable
internal fun gHoldsOnGlass(text: Color): Boolean {
    val ground = G.ground
    val liquid = G.groundTone.liquid
    return remember(ground, liquid, text) { ground.holds(text, Color.Transparent, liquid) }
}

/** The text on a glass tinted `tint` (prominent), on the current ground. */
@Composable
internal fun gInkOnTint(tint: Color): Color {
    val ground = G.ground
    val liquid = G.groundTone.liquid
    return remember(ground, liquid, tint) { ground.inkOnTint(tint, liquid) }
}

/** The liquid glass's colours: saturated (`saturationLiquid`), then brightened (`brightnessLiquid`). */
private fun gLiquidMatrix(): ColorMatrix = ColorMatrix().apply {
    setToSaturation(GGlassValues.saturationLiquid)
    val b = GGlassValues.brightnessLiquid
    timesAssign(ColorMatrix(floatArrayOf(b, 0f, 0f, 0f, 0f, 0f, b, 0f, 0f, 0f, 0f, 0f, b, 0f, 0f, 0f, 0f, 0f, 1f, 0f)))
}

/** The live blur, its colours, and (Android 13) the refracting edge, as one RenderEffect for a glass of `size`. */
private fun gLiquidEffect(blur: Float, size: Size, corner: Float, density: Float): androidx.compose.ui.graphics.RenderEffect {
    // CSS's blur(9px) is a Gaussian's sigma: RenderEffect's radius is one too.
    val blurred = AndroidRenderEffect.createBlurEffect(blur, blur, Shader.TileMode.CLAMP)
    val coloured = AndroidRenderEffect.createColorFilterEffect(
        android.graphics.ColorMatrixColorFilter(gLiquidMatrix().values), blurred)
    if (Build.VERSION.SDK_INT < 33 || size.width <= 0f || size.height <= 0f) return coloured.asComposeRenderEffect()
    return AndroidRenderEffect.createChainEffect(GRefraction.effect(size, corner, density), coloured).asComposeRenderEffect()
}

/**
 * The edge that refracts (Android 13): near the contour, what is under the glass is drawn from a little further in, as
 * through the rounded edge of a lens; the middle is left as it is.
 */
@RequiresApi(33)
private object GRefraction {
    private const val SOURCE = """
        uniform shader content;
        uniform float2 size;
        uniform float radius;
        uniform float edge;
        uniform float strength;

        float box(float2 p, float2 b, float r) {
            float2 q = abs(p) - b + r;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        half4 main(float2 coord) {
            float2 half_size = size * 0.5;
            float2 p = coord - half_size;
            float d = box(p, half_size, radius);
            float t = clamp(1.0 + d / edge, 0.0, 1.0);
            if (t <= 0.0) return content.eval(coord);
            float2 n = float2(box(p + float2(1.0, 0.0), half_size, radius) - box(p - float2(1.0, 0.0), half_size, radius),
                              box(p + float2(0.0, 1.0), half_size, radius) - box(p - float2(0.0, 1.0), half_size, radius));
            float len = length(n);
            if (len > 0.0) n = n / len;
            return content.eval(coord - n * strength * t * t);
        }
    """

    fun effect(size: Size, corner: Float, density: Float): AndroidRenderEffect {
        val shader = RuntimeShader(SOURCE)
        val r = corner.coerceAtMost(min(size.width, size.height) / 2)
        shader.setFloatUniform("size", size.width, size.height)
        shader.setFloatUniform("radius", r)
        shader.setFloatUniform("edge", (10f * density).coerceAtMost(min(size.width, size.height) / 2).coerceAtLeast(1f))
        shader.setFloatUniform("strength", 6f * density)
        return AndroidRenderEffect.createRuntimeShaderEffect(shader, "content")
    }
}

// MARK: Inset lists

/**
 * A list without lines: its rows apart by 2, each rounded (`GRadius.row`), the chosen one in thick glass. On a content
 * glass at `glass` (null: right on the ground). In a lazy list, lay `GInsetRow`s with `Arrangement.spacedBy(2.dp)`.
 */
@Composable
fun GInsetList(
    modifier: Modifier = Modifier,
    glass: GGlassDensity? = GGlassDensity.Regular,
    content: @Composable ColumnScope.() -> Unit,
) {
    val inner = Modifier.fillMaxWidth().padding(6.dp)
    if (glass == null) Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(2.dp), content = content)
    else GGlass(modifier.fillMaxWidth(), glass) {
        Column(inner, verticalArrangement = Arrangement.spacedBy(2.dp), content = content)
    }
}

/**
 * A row of an inset list: what it holds, 44 high at least, 12 on the sides; `selected`: in thick glass, its light on
 * top, a near shadow. Touched if `onClick`.
 */
@Composable
fun GInsetRow(
    modifier: Modifier = Modifier,
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val shape = RoundedCornerShape(GRadius.row)
    Row(
        modifier.fillMaxWidth()
            .then(if (selected) Modifier.gGlass(GGlassDensity.Thick, shape, GGlassShadow.Near) else Modifier)
            .clip(shape)
            .semantics { this.selected = selected }
            .then(if (onClick != null) Modifier.clickable(role = Role.Button, onClick = onClick) else Modifier)
            .heightIn(min = GControlMetrics.touchTarget).padding(horizontal = 12.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CompositionLocalProvider(LocalContentColor provides G.colors.ink) { content() }
    }
}

/** A field's ground on the ground's glass (a field, a choice's face, a chip): light white, or a veil of white on dark. */
internal val GGroundSpec.fieldFill: Color
    get() = when (kind) {
        GGlassKind.LIGHT -> Color.White.copy(alpha = 0.7f)
        GGlassKind.DARK -> Color.White.copy(alpha = 0.07f)
        GGlassKind.TINTED -> Color.White.copy(alpha = 0.12f)
    }

/**
 * A slice of a content glass laid row by row (a lazy list's section): the ground's copy and the glass at its place,
 * the edge's light of the whole card cut to the slice (its top on the first, its bottom on the last, nothing between
 * two rows), the shadow under the last.
 */
@Composable
internal fun Modifier.gGlassSlice(first: Boolean, last: Boolean, density: GGlassDensity = GGlassDensity.Regular): Modifier {
    val colors = G.colors
    val reduced = G.reduceTransparency
    val contrast = G.highContrast
    val painter = rememberGGroundPainter()
    val position = remember { GPosition() }
    val r = GRadius.glass
    val shape = RoundedCornerShape(topStart = if (first) r else 0.dp, topEnd = if (first) r else 0.dp,
        bottomStart = if (last) r else 0.dp, bottomEnd = if (last) r else 0.dp)
    val tint = when {
        reduced -> G.ground.glass.copy(alpha = GGlassValues.reduced)
        density == GGlassDensity.Thin -> colors.glassThin
        density == GGlassDensity.Regular -> colors.glassRegular
        else -> colors.glassThick
    }
    val shadows = if (!last) emptyList() else listOf(
        GShadow(GGlassValues.shadowY, GGlassValues.shadowBlur, GGlassValues.shadowSpread, colors.glassShadow),
        GShadow(GGlassValues.shadowNearY, GGlassValues.shadowNearBlur, GGlassValues.shadowNearSpread, colors.glassShadowNear))
    val saturate = remember { ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(GGlassValues.saturationContent) }) }
    return this.onGloballyPositioned { position.value = it.positionInWindow() }.drawWithCache {
        val path = shape.createOutline(size, layoutDirection, this).path()
        val shade = shadowPainter(shape, path, shadows)
        val radius = r.toPx()
        val line = 1.dp.toPx()
        // The whole card's edge, drawn beyond the slice and cut to it. The slice does not know the card's height: its light
        // goes out by the first slice's bottom and comes back from the last one's top.
        val top = if (first) 0f else -radius * 2
        val bottom = if (last) size.height else size.height + radius * 2
        val card = Path().apply {
            addRoundRect(androidx.compose.ui.geometry.RoundRect(line / 2, top + line / 2, size.width - line / 2, bottom - line / 2,
                androidx.compose.ui.geometry.CornerRadius(radius)))
        }
        onDrawBehind {
            shade()
            clipPath(path) {
                if (!reduced) painter.paint(this, position.value, blurred = true, filter = saturate)
                drawRect(tint)
                if (contrast) drawPath(card, colors.border, style = Stroke(line))
            }
            if (!contrast && (first || last)) {
                val from = when { first -> 0f; else -> -size.height }
                val to = when { last -> size.height; else -> size.height * 2 }
                gSheen(path, colors.glassSheen, from, to)
                gEdgeLight(path, card, if (first) colors.glassRimTop else Color.Transparent,
                    if (last) colors.glassRimBottom else Color.Transparent, from, to)
            }
        }
    }
}
